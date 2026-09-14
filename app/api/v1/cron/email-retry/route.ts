import { NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { sendEmail } from "@/infrastructure/email/resendClient";
import { logger } from "@/infrastructure/logger/logger";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 mins max Vercel timeout

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${getEnv().CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch up to 50 pending or failed emails with retry_count < 3
    const { data: dlqRecords, error: fetchError } = (await (adminClient.from("email_dlq") as any)
      .select("*")
      .lt("retry_count", 3)
      .in("status", ["pending", "failed"])
      .order("created_at", { ascending: true })
      .limit(50)) as { data: any[] | null; error: any };

    if (fetchError || !dlqRecords) {
      logger.error({ event: "dlq_fetch_error", error: fetchError?.message });
      return NextResponse.json({ error: "Failed to fetch DLQ" }, { status: 500 });
    }

    if (dlqRecords.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    let processed = 0;
    let successful = 0;

    for (const record of dlqRecords) {
      processed++;
      const result = await sendEmail({
        to: record.recipient_email,
        subject: record.subject,
        html: record.html,
        skipDlq: true,
      });

      if (result.success) {
        successful++;
        await (adminClient.from("email_dlq") as any)
          .update({ status: "success", updated_at: new Date().toISOString() })
          .eq("id", record.id);
      } else {
        await (adminClient.from("email_dlq") as any)
          .update({
            retry_count: (record.retry_count || 0) + 1,
            last_error: result.error || "Retry failed",
            status: (record.retry_count || 0) + 1 >= 3 ? "dead" : "failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", record.id);
      }
    }

    return NextResponse.json({ success: true, processed, successful });
  } catch (error: any) {
    logger.error({ event: "dlq_retry_exception", error: error.message });
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

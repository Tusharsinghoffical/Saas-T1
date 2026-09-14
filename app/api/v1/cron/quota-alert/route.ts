import { NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { sendEmail } from "@/infrastructure/email/resendClient";
import { logger } from "@/infrastructure/logger/logger";
import { getEnv } from "@/lib/env";
import * as crypto from "crypto";
import { redisGet } from "@/infrastructure/redis/redisClient";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedHeader = `Bearer ${getEnv().CRON_SECRET}`;
    const providedHeader = authHeader || "";

    if (
      providedHeader.length !== expectedHeader.length ||
      !crypto.timingSafeEqual(
        Buffer.from(providedHeader),
        Buffer.from(expectedHeader)
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    let warnings = [];

    // 1. Check Upstash Redis Quota (10,000 cmds/day limit)
    const upstashCountStr = await redisGet(`quota:upstash:commands:${today}`);
    const upstashCount = upstashCountStr ? parseInt(upstashCountStr, 10) : 0;
    if (upstashCount > 7000) {
      warnings.push(`⚠️ Upstash Redis commands today: ${upstashCount} / 10000 (Over 70%)`);
    }

    // 2. Check Resend Email Daily Quota (100/day limit)
    const resendCountStr = await redisGet(`quota:resend:emails:${today}`);
    const resendCount = resendCountStr ? parseInt(resendCountStr, 10) : 0;
    if (resendCount > 70) {
      warnings.push(`⚠️ Resend emails sent today: ${resendCount} / 100 (Over 70%)`);
    }
    
    // 3. Check Supabase DB Size Quota (500MB limit)
    const { data: dbSize, error: sizeErr } = await adminClient.rpc("get_db_size");
    if (!sizeErr && typeof dbSize === "number") {
      const DB_LIMIT_BYTES = 500 * 1024 * 1024; // 500MB
      const thresholdBytes = DB_LIMIT_BYTES * 0.7; // 70%
      
      if (dbSize > thresholdBytes) {
        warnings.push(`⚠️ Supabase Database size is ${Math.round(dbSize / 1024 / 1024)}MB, nearing the 500MB limit.`);
      }
    }

    if (warnings.length > 0) {
      logger.warn({ event: "quota_threshold_alert", warnings });
      // Send alert email to operator (e.g. system admin)
      const adminEmail = process.env.ADMIN_ALERT_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: "🚨 TASQ-ONE Quota Warning",
          html: `<p>The following free-tier quotas are nearing their limits:</p><ul>${warnings.map(w => `<li>${w}</li>`).join("")}</ul>`,
          skipDlq: true, // prevent loops
        });
      }
    }

    return NextResponse.json({ success: true, alerts: warnings });
  } catch (error: any) {
    logger.error({ event: "quota_alert_exception", error: error.message });
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

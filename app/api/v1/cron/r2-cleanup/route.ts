import { NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { deleteR2Object } from "@/infrastructure/storage/r2Storage";
import { logger } from "@/infrastructure/logger/logger";
import { getEnv } from "@/lib/env";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

    // Query tasks soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tasks, error: fetchError } = (await adminClient
      .from("tasks")
      .select("id, org_id, deleted_at, task_attachments(id, file_url)")
      .not("deleted_at", "is", null)
      .lt("deleted_at", thirtyDaysAgo)) as {
      data: Array<{
        id: string;
        org_id: string;
        deleted_at: string | null;
        task_attachments: Array<{ id: string; file_url: string | null }> | null;
      }> | null;
      error: any;
    };

    if (fetchError || !tasks) {
      logger.error({ event: "r2_cleanup_fetch_error", error: fetchError?.message });
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    let processedCount = 0;
    let filesDeleted = 0;

    const bucket = process.env.CLOUDFLARE_R2_BUCKET || "tasq-attachments";
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || "";
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";

    if (bucket && endpoint && accessKeyId && secretAccessKey) {
      for (const task of tasks) {
        processedCount++;
        const attachments = Array.isArray(task.task_attachments) ? task.task_attachments : [task.task_attachments];
        
        for (const attachment of attachments) {
          if (!attachment) continue;
          
          if (attachment.file_url) {
            try {
              const urlObj = new URL(attachment.file_url);
              const key = decodeURIComponent(urlObj.pathname.substring(1));
              const deleted = await deleteR2Object({
                bucket,
                key,
                endpoint,
                accessKeyId,
                secretAccessKey,
              });
              if (deleted) {
                filesDeleted++;
              }
            } catch (e: any) {
              logger.error({ event: "r2_cleanup_delete_error", error: e.message });
            }
          }

          // Hard-delete the task_attachments row
          await adminClient
            .from("task_attachments")
            .delete()
            .eq("id", attachment.id);
        }

        // Log to activity_logs with system actor
        await (adminClient.from("activity_logs") as any).insert({
          org_id: task.org_id,
          actor_id: "system", // Use system actor
          action: "system.r2_cleanup",
          entity: "tasks",
          entity_id: task.id,
          diff: { message: `Cleaned up ${attachments.length} attachments after 30-day grace period.` },
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      filesDeleted,
    });
  } catch (error: any) {
    logger.error({ event: "r2_cleanup_exception", error: error.message });
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

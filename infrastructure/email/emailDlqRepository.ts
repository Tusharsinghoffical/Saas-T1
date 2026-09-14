import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { logger } from "@/infrastructure/logger/logger";

export interface EmailDlqRecord {
  recipient_email: string;
  subject: string;
  html: string;
  last_error?: string;
  org_id?: string;
}

export async function pushToEmailDlq(record: EmailDlqRecord): Promise<void> {
  try {
    const adminClient = createAdminClient();
    const { error } = await (adminClient.from("email_dlq") as any)
      .insert({
        recipient_email: record.recipient_email,
        subject: record.subject,
        html: record.html,
        last_error: record.last_error || null,
        org_id: record.org_id || null,
        status: "pending",
        retry_count: 0
      });

    if (error) {
      logger.error({
        event: "email_dlq_push_failed",
        error: error.message,
        recipient: record.recipient_email
      });
    }
  } catch (err: any) {
    logger.error({
      event: "email_dlq_push_exception",
      error: err.message,
      recipient: record.recipient_email
    });
  }
}

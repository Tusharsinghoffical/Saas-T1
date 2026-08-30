/**
 * Slack Incoming Webhook Dispatcher
 *
 * SECURITY: Defense-in-depth SSRF guard (FAIL 7.7 remediation).
 * The usecase layer (testSlackWebhook.ts) enforces this domain allowlist first.
 * This guard is a secondary layer at the infrastructure boundary.
 */

import { ValidationError } from "@/shared/errors/domainErrors";

export interface SlackNotificationPayload {
  webhookUrl: string;
  type: string;
  title: string;
  taskTitle?: string;
  taskId?: string;
  assigneeName?: string;
  orgName?: string;
}

// Official Slack incoming webhook base URL — only prefix allowed.
const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/services/";

export async function sendSlackNotification({
  webhookUrl,
  type,
  title,
  taskTitle,
  taskId,
  assigneeName,
  orgName = "TASQ-ONE Workspace",
}: SlackNotificationPayload): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl || webhookUrl.includes("placeholder")) {
    console.log(`[Slack Mock] Dispatching '${type}' notification: "${title}"`);
    return { success: true };
  }

  // ── SECURITY FIX (SSRF — FAIL 7.7): Infrastructure-layer domain guard.
  // Reject any non-Slack URL before making any outbound HTTP request.
  // This is secondary defense-in-depth; the usecase layer also validates.
  if (!webhookUrl.startsWith(SLACK_WEBHOOK_PREFIX)) {
    throw new ValidationError(
      `Invalid Slack webhook URL. Only ${SLACK_WEBHOOK_PREFIX}... URLs are permitted.`
    );
  }

  try {
    const payload = {
      text: `*${orgName}* — ${title}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${title}*\n${taskTitle ? `> *Task:* ${taskTitle}\n` : ""}${assigneeName ? `> *Assignee:* ${assigneeName}\n` : ""}`,
          },
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `Slack webhook responded with status ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send Slack webhook notification" };
  }
}

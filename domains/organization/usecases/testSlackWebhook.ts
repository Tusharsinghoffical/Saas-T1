import { sendSlackNotification } from "@/infrastructure/slack/slackClient";
import { ValidationError } from "@/shared/errors/domainErrors";

// Allowed Slack webhook URL prefix — enforced here (usecase layer) as a
// business-rule guard. The infrastructure/slack/slackClient also enforces
// this as defense-in-depth. Both layers must pass for a request to proceed.
const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/services/";

export async function testSlackWebhookUseCase(
  webhookUrl: string,
  orgName?: string
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl) {
    throw new ValidationError("Please provide a valid Slack Webhook URL to test.");
  }

  // ── SECURITY FIX (SSRF — FAIL 7.7): Enforce strict domain allowlist.
  // Reject any URL that does not begin with the official Slack webhook prefix.
  // This prevents SSRF to internal services (metadata endpoints, VPC, etc.).
  // DDS layer: UseCase — business rule enforcement before any I/O call.
  if (!webhookUrl.startsWith(SLACK_WEBHOOK_PREFIX)) {
    throw new ValidationError(
      `Invalid Slack webhook URL. Must start with ${SLACK_WEBHOOK_PREFIX}`
    );
  }

  const testRes = await sendSlackNotification({
    webhookUrl,
    type: "test",
    title: "Test Connection",
    orgName: orgName || "TASQ-ONE Workspace",
  });

  if (!testRes.success) {
    throw new ValidationError(testRes.error || "Failed to deliver message to Slack.");
  }

  return {
    success: true,
    message: "Test message sent to Slack successfully! Check your channel.",
  };
}

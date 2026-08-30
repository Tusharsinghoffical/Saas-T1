import { DispatchNotificationDTO } from "../entities/Notification";
import { INotificationRepository, notificationRepository } from "../repository/notificationRepository";
import { sendEmail, buildNotificationEmailHtml } from "@/infrastructure/email/resendClient";
import { sendSlackNotification } from "@/infrastructure/slack/slackClient";
import { ValidationError } from "@/shared/errors/domainErrors";

export async function dispatchEmailNotificationUseCase(
  data: DispatchNotificationDTO,
  repo: INotificationRepository = notificationRepository
): Promise<{ success: boolean; id?: string; error?: string; skipped?: boolean; reason?: string }> {
  const { recipientUserId, type, title, message, taskId } = data;

  if (!recipientUserId || !type || !title || !message) {
    throw new ValidationError("Missing required notification payload parameters.");
  }

  const { email, preferences, orgId, fullName } = await repo.getUserPreferencesAndEmail(recipientUserId);

  // Check user preference for this event type
  const prefKey = type.replace(".", "_") as keyof typeof preferences;
  const isEnabled = preferences[prefKey] !== false;

  if (!isEnabled) {
    return {
      success: true,
      skipped: true,
      reason: `User has disabled email notifications for '${type}'.`,
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tasq-one.com";
  const actionUrl = taskId ? `${baseUrl}/employee/dashboard` : baseUrl;

  const html = buildNotificationEmailHtml({
    title,
    message,
    actionUrl,
  });

  const result = await sendEmail({
    to: email,
    subject: `[TASQ-ONE] ${title}`,
    html,
  });

  // Dispatch to Slack Webhook if org configured
  if (orgId) {
    try {
      const orgSettings = await repo.getOrgSlackSettings(orgId);
      if (orgSettings?.slackWebhookUrl && orgSettings?.slackNotificationsEnabled !== false) {
        sendSlackNotification({
          webhookUrl: orgSettings.slackWebhookUrl,
          type,
          title,
          taskTitle: title,
          taskId,
          assigneeName: fullName || undefined,
          orgName: orgSettings.name,
        }).catch((err) => {
          console.warn("[Slack Dispatch Non-Fatal]", err);
        });
      }
    } catch {
      // Safe fallback
    }
  }

  return {
    success: result.success,
    id: result.id,
    error: result.error,
  };
}

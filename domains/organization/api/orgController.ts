import { requireRole } from "@/shared/middleware/rbacGuard";
import { getOrgSettingsUseCase } from "../usecases/getOrgSettings";
import { updateOrgSettingsUseCase } from "../usecases/updateOrgSettings";
import { testSlackWebhookUseCase } from "../usecases/testSlackWebhook";
import { recordActivityLogUseCase } from "@/domains/activity";
import { requireAuth } from "@/shared/middleware/rbacGuard";

export class OrgController {
  async getSettings() {
    const auth = await requireAuth();
    return await getOrgSettingsUseCase(auth);
  }

  async updateSettings(body: any) {
    // ── SECURITY FIX (SSRF — FAIL 7.7): requireRole MUST be called FIRST,
    // before any body destructuring or test-path branching. Previously the
    // `if (test)` block ran before authentication, enabling unauthenticated
    // SSRF to arbitrary internal network endpoints. ──────────────────────
    const auth = await requireRole(["admin"]);

    const { name, timezone, slack_webhook_url, slack_notifications_enabled, test } = body;

    // Handle Test Message Action (now gated behind admin auth)
    if (test) {
      return await testSlackWebhookUseCase(slack_webhook_url, name);
    }

    const updates = {
      name,
      timezone,
      slackWebhookUrl: slack_webhook_url,
      slackNotificationsEnabled: slack_notifications_enabled,
    };

    const updatedOrg = await updateOrgSettingsUseCase(auth, updates);

    // Record Activity Log
    await recordActivityLogUseCase({
      orgId: auth.orgId,
      actorId: auth.userId,
      action: "settings.update",
      entity: "organizations",
      entityId: auth.orgId,
      diff: updates,
    });

    return updatedOrg;
  }
}

export const orgController = new OrgController();

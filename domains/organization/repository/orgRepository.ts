import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { Organization, OrgSettingsUpdate } from "../entities/Organization";

export interface IOrgRepository {
  getOrgById(orgId: string): Promise<Organization | null>;
  updateOrg(orgId: string, updates: OrgSettingsUpdate): Promise<Organization>;
  listOrganizations(): Promise<{ id: string; name: string }[]>;
}

export class SupabaseOrgRepository implements IOrgRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async getOrgById(orgId: string): Promise<Organization | null> {
    if (!this.hasSupabase()) {
      return {
        id: orgId || "org-demo-1",
        name: "Acme Corp",
        timezone: "America/New_York",
        slackWebhookUrl: "",
        slackNotificationsEnabled: false,
      };
    }

    const adminClient = createAdminClient();
    const { data: org, error } = await (adminClient.from("organizations") as any)
      .select("id, name, timezone, slack_webhook_url, slack_notifications_enabled, logo_url, created_at")
      .eq("id", orgId)
      .single();

    if (error || !org) {
      return null;
    }

    return {
      id: org.id,
      name: org.name,
      logoUrl: org.logo_url,
      timezone: org.timezone,
      slackWebhookUrl: org.slack_webhook_url,
      slackNotificationsEnabled: org.slack_notifications_enabled ?? true,
      createdAt: org.created_at,
    };
  }

  async updateOrg(orgId: string, updates: OrgSettingsUpdate): Promise<Organization> {
    if (!this.hasSupabase()) {
      return {
        id: orgId || "org-demo-1",
        name: updates.name || "Acme Corp",
        timezone: updates.timezone || "America/New_York",
        slackWebhookUrl: updates.slackWebhookUrl || "",
        slackNotificationsEnabled: updates.slackNotificationsEnabled ?? false,
      };
    }

    const adminClient = createAdminClient();
    const dbPayload: Record<string, any> = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.timezone !== undefined) dbPayload.timezone = updates.timezone;
    if (updates.slackWebhookUrl !== undefined) dbPayload.slack_webhook_url = updates.slackWebhookUrl;
    if (updates.slackNotificationsEnabled !== undefined) {
      dbPayload.slack_notifications_enabled = updates.slackNotificationsEnabled;
    }

    const { data: updatedOrg, error } = await (adminClient.from("organizations") as any)
      .update(dbPayload)
      .eq("id", orgId)
      .select("id, name, timezone, slack_webhook_url, slack_notifications_enabled, logo_url, created_at")
      .single();

    if (error || !updatedOrg) {
      throw new Error(error?.message || "Failed to update organization");
    }

    return {
      id: updatedOrg.id,
      name: updatedOrg.name,
      logoUrl: updatedOrg.logo_url,
      timezone: updatedOrg.timezone,
      slackWebhookUrl: updatedOrg.slack_webhook_url,
      slackNotificationsEnabled: updatedOrg.slack_notifications_enabled ?? true,
      createdAt: updatedOrg.created_at,
    };
  }

  async listOrganizations(): Promise<{ id: string; name: string }[]> {
    if (!this.hasSupabase()) {
      return [{ id: "org-demo-1", name: "Acme Corp" }];
    }

    const adminClient = createAdminClient();
    const { data: orgs, error } = await (adminClient.from("organizations") as any).select("id, name");
    if (error || !orgs) {
      throw new Error(error?.message || "Failed to list organizations");
    }
    return orgs;
  }
}

export const orgRepository = new SupabaseOrgRepository();

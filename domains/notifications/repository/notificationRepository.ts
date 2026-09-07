import {
  createClient,
  createAdminClient,
} from "@/infrastructure/supabase/supabaseServer";
import {
  Notification,
  NotificationPreferences,
} from "../entities/Notification";

export interface INotificationRepository {
  listNotifications(userId: string): Promise<Notification[]>;
  markAsRead(userId: string, targetId: string): Promise<void>;
  getUserPreferencesAndEmail(
    userId: string
  ): Promise<{
    email: string;
    preferences: NotificationPreferences;
    orgId?: string | null;
    fullName?: string | null;
  }>;
  getOrgSlackSettings(
    orgId: string
  ): Promise<{
    name: string;
    slackWebhookUrl?: string | null;
    slackNotificationsEnabled?: boolean | null;
  } | null>;
}

export class SupabaseNotificationRepository implements INotificationRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    if (!this.hasSupabase()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Supabase configuration missing in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return [];
    }

    const supabaseClient: any = createClient();
    const { data: notifications, error } = await (
      supabaseClient.from("notifications") as any
    )
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Notifications lookup notice:", error.message);
      try {
        const adminClient = createAdminClient();
        const { data: adminNotifs } = await (
          adminClient.from("notifications") as any
        )
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (adminNotifs && adminNotifs.length > 0) {
          return adminNotifs.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            user_id: n.user_id,
            type: n.type,
            payload: n.payload,
            readAt: n.read_at,
            read_at: n.read_at,
            createdAt: n.created_at,
            created_at: n.created_at,
          }));
        }
      } catch {}
      return [];
    }

    return (notifications || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      user_id: n.user_id,
      type: n.type,
      payload: n.payload,
      readAt: n.read_at,
      read_at: n.read_at,
      createdAt: n.created_at,
      created_at: n.created_at,
    }));
  }

  async markAsRead(userId: string, targetId: string): Promise<void> {
    if (!this.hasSupabase()) return;

    const supabase = createClient();
    const nowIso = new Date().toISOString();

    if (targetId === "all") {
      const { error } = await (supabase.from("notifications") as any)
        .update({ read_at: nowIso })
        .eq("user_id", userId)
        .is("read_at", null);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await (supabase.from("notifications") as any)
        .update({ read_at: nowIso })
        .eq("id", targetId)
        .eq("user_id", userId);

      if (error) throw new Error(error.message);
    }
  }

  async getUserPreferencesAndEmail(userId: string): Promise<{
    email: string;
    preferences: NotificationPreferences;
    orgId?: string | null;
    fullName?: string | null;
  }> {
    let recipientEmail = "member@example.com";
    let preferences: NotificationPreferences = {
      task_assigned: true,
      task_mentioned: true,
      task_due_soon: true,
      task_overdue: true,
    };
    let orgId: string | null = null;
    let fullName: string | null = null;

    if (this.hasSupabase()) {
      const supabase = createClient();
      const { data: profile } = await (supabase.from("profiles") as any)
        .select(
          "id, org_id, full_name, notification_preferences, auth:id (email)"
        )
        .eq("id", userId)
        .single();

      if (profile) {
        orgId = profile.org_id;
        fullName = profile.full_name;
        if (profile.notification_preferences) {
          preferences = { ...preferences, ...profile.notification_preferences };
        }
        if (profile.auth?.email) {
          recipientEmail = profile.auth.email;
        }
      }
    }

    return {
      email: recipientEmail,
      preferences,
      orgId,
      fullName,
    };
  }

  async getOrgSlackSettings(orgId: string): Promise<{
    name: string;
    slackWebhookUrl?: string | null;
    slackNotificationsEnabled?: boolean | null;
  } | null> {
    if (!this.hasSupabase()) return null;

    const supabase = createClient();
    const { data: orgData } = await (supabase.from("organizations") as any)
      .select("name, slack_webhook_url")
      .eq("id", orgId)
      .single();

    if (!orgData) return null;

    return {
      name: orgData.name,
      slackWebhookUrl: orgData.slack_webhook_url,
      slackNotificationsEnabled: false,
    };
  }
}

export const notificationRepository = new SupabaseNotificationRepository();

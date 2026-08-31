import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { Notification, NotificationPreferences } from "../entities/Notification";

export interface INotificationRepository {
  listNotifications(userId: string): Promise<Notification[]>;
  markAsRead(userId: string, targetId: string): Promise<void>;
  getUserPreferencesAndEmail(userId: string): Promise<{ email: string; preferences: NotificationPreferences; orgId?: string | null; fullName?: string | null }>;
  getOrgSlackSettings(orgId: string): Promise<{ name: string; slackWebhookUrl?: string | null; slackNotificationsEnabled?: boolean | null } | null>;
}

export class SupabaseNotificationRepository implements INotificationRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    if (!this.hasSupabase()) {
      return [
        {
          id: "notif-1",
          userId,
          type: "task.assigned",
          payload: {
            task_id: "task-1",
            task_title: "Set up company workspace & review OKRs",
            actor_name: "Jane Doe (Admin)",
            message: "You were assigned to task: Set up company workspace & review OKRs",
          },
          readAt: null,
          createdAt: new Date(Date.now() - 60000 * 15).toISOString(),
        },
        {
          id: "notif-2",
          userId,
          type: "task.mentioned",
          payload: {
            task_id: "task-2",
            task_title: "Implement Postgres RLS policy test suite",
            actor_name: "Alex Smith",
            message: "Alex Smith mentioned you in Implement Postgres RLS policy test suite",
          },
          readAt: null,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "notif-3",
          userId,
          type: "task.due_soon",
          payload: {
            task_id: "task-3",
            task_title: "Set up Upstash Redis rate limiting bucket",
            message: "Task is due within 24 hours: Set up Upstash Redis rate limiting bucket",
          },
          readAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
      ];
    }

    let supabaseClient: any = createClient();
    let { data: notifications, error } = await (supabaseClient.from("notifications") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      try {
        const adminClient = createAdminClient();
        const { data: adminNotifs, error: adminErr } = await (adminClient.from("notifications") as any)
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (!adminErr && adminNotifs) {
          notifications = adminNotifs;
          error = null;
        }
      } catch {
        // Fallback
      }
    }

    if (error) {
      console.warn("Notifications lookup notice:", error.message);
      return [];
    }

    return (notifications || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      payload: n.payload,
      readAt: n.read_at,
      createdAt: n.created_at,
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
        .select("id, org_id, full_name, notification_preferences, auth:id (email)")
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
      .select("name, slack_webhook_url, slack_notifications_enabled")
      .eq("id", orgId)
      .single();

    if (!orgData) return null;

    return {
      name: orgData.name,
      slackWebhookUrl: orgData.slack_webhook_url,
      slackNotificationsEnabled: orgData.slack_notifications_enabled,
    };
  }
}

export const notificationRepository = new SupabaseNotificationRepository();

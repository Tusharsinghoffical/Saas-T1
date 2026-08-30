import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { UserProfile } from "../entities/UserProfile";

export interface IUserRepository {
  getProfileById(userId: string): Promise<UserProfile | null>;
  listOrgMembers(orgId: string): Promise<UserProfile[]>;
}

export class SupabaseUserRepository implements IUserRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async getProfileById(userId: string): Promise<UserProfile | null> {
    if (!this.hasSupabase()) {
      return {
        id: userId,
        orgId: "11111111-1111-1111-1111-111111111111",
        fullName: "Demo User",
        role: "admin",
        avatarUrl: null,
        email: "demo@tasq-one.com",
      };
    }

    const supabase = createClient();
    const { data: profile, error } = await (supabase.from("profiles") as any)
      .select("id, org_id, full_name, role, avatar_url, notification_preferences, auth:id (email), created_at")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return null;
    }

    return {
      id: profile.id,
      orgId: profile.org_id,
      fullName: profile.full_name,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      email: profile.auth?.email,
      notificationPreferences: profile.notification_preferences,
      createdAt: profile.created_at,
    };
  }

  async listOrgMembers(orgId: string): Promise<UserProfile[]> {
    if (!this.hasSupabase()) {
      return [
        { id: "mem-1", orgId, fullName: "Jane Doe (Admin)", role: "admin", avatarUrl: null },
        { id: "mem-2", orgId, fullName: "Alex Smith (Lead)", role: "manager", avatarUrl: null },
        { id: "mem-3", orgId, fullName: "Rohan Patel (Dev)", role: "employee", avatarUrl: null },
      ];
    }

    const adminClient = createAdminClient();
    const { data: profiles, error } = await (adminClient.from("profiles") as any)
      .select("id, org_id, full_name, role, avatar_url, notification_preferences, created_at")
      .eq("org_id", orgId);

    if (error || !profiles) {
      return [];
    }

    return profiles.map((p: any) => ({
      id: p.id,
      orgId: p.org_id,
      fullName: p.full_name,
      role: p.role,
      avatarUrl: p.avatar_url,
      notificationPreferences: p.notification_preferences,
      createdAt: p.created_at,
    }));
  }
}

export const userRepository = new SupabaseUserRepository();

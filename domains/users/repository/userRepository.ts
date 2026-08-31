import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { UserProfile } from "../entities/UserProfile";

export interface IUserRepository {
  getProfileById(userId: string): Promise<UserProfile | null>;
  listOrgMembers(orgId: string): Promise<UserProfile[]>;
  softDeleteUser(userId: string, orgId: string): Promise<boolean>;
  inviteUser(orgId: string, email: string, role: "admin" | "manager" | "employee", inviterId: string): Promise<{ success: boolean; message: string }>;
  acceptInvite(password: string): Promise<{ success: boolean }>;
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
        deletedAt: null,
      };
    }

    const supabase = createClient();
    const { data: profile, error } = await (supabase.from("profiles") as any)
      .select("id, org_id, full_name, role, avatar_url, notification_preferences, auth:id (email), created_at, deleted_at")
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
      deletedAt: profile.deleted_at,
    };
  }

  async listOrgMembers(orgId: string): Promise<UserProfile[]> {
    if (!this.hasSupabase()) {
      return [
        { id: "mem-1", orgId, fullName: "Jane Doe (Admin)", role: "admin", avatarUrl: null, deletedAt: null },
        { id: "mem-2", orgId, fullName: "Alex Smith (Lead)", role: "manager", avatarUrl: null, deletedAt: null },
        { id: "mem-3", orgId, fullName: "Rohan Patel (Dev)", role: "employee", avatarUrl: null, deletedAt: null },
      ];
    }

    const adminClient = createAdminClient();
    const { data: profiles, error } = await (adminClient.from("profiles") as any)
      .select("id, org_id, full_name, role, avatar_url, notification_preferences, created_at, deleted_at")
      .eq("org_id", orgId)
      .is("deleted_at", null);

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
      deletedAt: p.deleted_at,
    }));
  }

  async softDeleteUser(userId: string, orgId: string): Promise<boolean> {
    if (!this.hasSupabase()) {
      return true;
    }

    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Soft-delete the profile row in database (preserves historical activity, comments & task links)
    const { error: dbError } = await (adminClient.from("profiles") as any)
      .update({ deleted_at: nowIso })
      .eq("id", userId)
      .eq("org_id", orgId);

    if (dbError) {
      throw new Error("Failed to deactivate team member.");
    }

    // 2. Disable/ban auth account so user cannot log in
    try {
      await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: "876000h", // 100 years ban
      });
    } catch {
      // Non-fatal if user is already banned or removed
    }

    return true;
  }

  async inviteUser(
    orgId: string,
    email: string,
    role: "admin" | "manager" | "employee",
    inviterId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.hasSupabase()) {
      return { success: true, message: `Mock invite sent to ${email}` };
    }

    const adminClient = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${appUrl}/accept-invite`;

    // Send single-use invite link via Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          org_id: orgId,
          role,
          invited_by: inviterId,
        },
      }
    );

    if (inviteError) {
      throw new Error(inviteError.message || "Failed to dispatch employee invitation.");
    }

    if (inviteData?.user) {
      // Pre-create pending profile row with invited role & org
      await (adminClient.from("profiles") as any).upsert({
        id: inviteData.user.id,
        org_id: orgId,
        role,
        full_name: email.split("@")[0],
      });
    }

    return { success: true, message: `Invite dispatched successfully to ${email}` };
  }

  async acceptInvite(password: string): Promise<{ success: boolean }> {
    if (!this.hasSupabase()) {
      return { success: true };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(error.message || "Failed to set account password.");
    }

    return { success: true };
  }
}

export const userRepository = new SupabaseUserRepository();

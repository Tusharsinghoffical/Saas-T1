import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { UserProfile } from "../entities/UserProfile";

export interface IUserRepository {
  getProfileById(userId: string): Promise<UserProfile | null>;
  listOrgMembers(orgId: string): Promise<UserProfile[]>;
  softDeleteUser(userId: string, orgId: string): Promise<boolean>;
  createUserWithPassword(
    orgId: string,
    email: string,
    password: string,
    fullName: string,
    role: "admin" | "manager" | "employee",
    creatorId: string
  ): Promise<{ user: any; profile: UserProfile }>;
  updateUserRole(
    userId: string,
    orgId: string,
    newRole: "admin" | "manager" | "employee"
  ): Promise<boolean>;
  inviteUser(orgId: string, email: string, role: "admin" | "manager" | "employee", inviterId: string): Promise<{ success: boolean; message: string }>;
  acceptInvite(password: string): Promise<{ success: boolean }>;
}

export class SupabaseUserRepository implements IUserRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return (
      Boolean(url) &&
      !url.includes("your-project-ref") &&
      Boolean(anonKey) &&
      !anonKey.includes("dummy")
    );
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
      .select("id, org_id, full_name, role, avatar_url, notification_preferences, created_at, deleted_at")
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
      notificationPreferences: profile.notification_preferences,
      createdAt: profile.created_at,
      deletedAt: profile.deleted_at,
    };
  }

  async listOrgMembers(orgId: string): Promise<UserProfile[]> {
    if (!this.hasSupabase()) {
      return [
        { id: "mem-1", orgId, fullName: "Jane Doe (Admin)", email: "jane@acme.com", role: "admin", avatarUrl: null, deletedAt: null },
        { id: "mem-2", orgId, fullName: "Alex Smith (Lead)", email: "alex@acme.com", role: "manager", avatarUrl: null, deletedAt: null },
        { id: "mem-3", orgId, fullName: "Rohan Patel (Dev)", email: "rohan@acme.com", role: "employee", avatarUrl: null, deletedAt: null },
      ];
    }

    const adminClient = createAdminClient();
    const { data: profiles, error } = await (adminClient.from("profiles") as any)
      .select("id, org_id, full_name, role, avatar_url, notification_preferences, created_at, deleted_at")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error || !profiles) {
      return [];
    }

    // Enrich with auth user emails
    const authUserMap: Record<string, string> = {};
    try {
      const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 200 });
      if (authList?.users) {
        authList.users.forEach((u) => {
          if (u.id && u.email) {
            authUserMap[u.id] = u.email;
          }
        });
      }
    } catch {
      // Non-blocking
    }

    return profiles.map((p: any) => ({
      id: p.id,
      orgId: p.org_id,
      fullName: p.full_name || "Team Member",
      email: authUserMap[p.id] || null,
      role: p.role || "employee",
      avatarUrl: p.avatar_url,
      notificationPreferences: p.notification_preferences,
      createdAt: p.created_at,
      deletedAt: p.deleted_at,
    }));
  }

  async createUserWithPassword(
    orgId: string,
    email: string,
    password: string,
    fullName: string,
    role: "admin" | "manager" | "employee",
    creatorId: string
  ): Promise<{ user: any; profile: UserProfile }> {
    if (!this.hasSupabase()) {
      const mockId = "mock-" + Date.now();
      return {
        user: { id: mockId, email },
        profile: {
          id: mockId,
          orgId,
          fullName,
          email,
          role,
          avatarUrl: null,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        },
      };
    }

    const adminClient = createAdminClient();

    // 1. Create auth user with confirmed email & role claims
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      app_metadata: {
        role,
        org_id: orgId,
      },
      user_metadata: {
        full_name: fullName,
        role,
        org_id: orgId,
      },
    });

    if (authError) {
      const errMsg = authError.message.toLowerCase();
      if (errMsg.includes("already registered") || errMsg.includes("already exists") || errMsg.includes("duplicate")) {
        throw new Error("A user with this email address already exists.");
      }
      throw new Error(authError.message || "Failed to create user credentials.");
    }

    if (!authData?.user) {
      throw new Error("Failed to create authentication user.");
    }

    const userId = authData.user.id;

    // 2. Upsert profile in profiles table
    const { error: profileError } = await (adminClient.from("profiles") as any).upsert({
      id: userId,
      org_id: orgId,
      full_name: fullName,
      role,
    });

    if (profileError) {
      throw new Error(profileError.message || "Failed to create user profile in organization.");
    }

    return {
      user: authData.user,
      profile: {
        id: userId,
        orgId,
        fullName,
        email,
        role,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      },
    };
  }

  async updateUserRole(
    userId: string,
    orgId: string,
    newRole: "admin" | "manager" | "employee"
  ): Promise<boolean> {
    if (!this.hasSupabase()) {
      return true;
    }

    const adminClient = createAdminClient();

    // 1. Update database profile
    const { error: dbError } = await (adminClient.from("profiles") as any)
      .update({ role: newRole })
      .eq("id", userId)
      .eq("org_id", orgId);

    if (dbError) {
      throw new Error(dbError.message || "Failed to update member role in database.");
    }

    // 2. Update auth user claims
    try {
      await adminClient.auth.admin.updateUserById(userId, {
        app_metadata: { role: newRole, org_id: orgId },
        user_metadata: { role: newRole },
      });
    } catch {
      // Non-blocking
    }

    return true;
  }

  async softDeleteUser(userId: string, orgId: string): Promise<boolean> {
    if (!this.hasSupabase()) {
      return true;
    }

    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Soft-delete the profile row in database
    const { error: dbError } = await (adminClient.from("profiles") as any)
      .update({ deleted_at: nowIso })
      .eq("id", userId)
      .eq("org_id", orgId);

    if (dbError) {
      throw new Error("Failed to deactivate team member.");
    }

    // 2. Disable auth account so user cannot log in
    try {
      await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: "876000h", // 100 years ban
      });
    } catch {
      // Non-fatal
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

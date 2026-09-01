import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { UserProfile } from "../entities/UserProfile";
import { ValidationError } from "@/shared/errors/domainErrors";

export interface IUserRepository {
  getProfileById(userId: string): Promise<UserProfile | null>;
  listOrgMembers(orgId: string): Promise<UserProfile[]>;
  softDeleteUser(userId: string, orgId: string): Promise<boolean>;
  ensureDefaultTeam(orgId: string): Promise<string>;
  assignUserToTeam(userId: string, orgId: string, teamId?: string | null): Promise<string>;
  createUserWithPassword(
    orgId: string,
    email: string,
    password: string,
    fullName: string,
    role: "admin" | "manager" | "employee",
    creatorId: string,
    teamId?: string | null
  ): Promise<{ user: any; profile: UserProfile }>;
  updateUserRole(
    userId: string,
    orgId: string,
    newRole: "admin" | "manager" | "employee"
  ): Promise<boolean>;
  inviteUser(
    orgId: string,
    email: string,
    role: "admin" | "manager" | "employee",
    inviterId: string,
    teamId?: string | null
  ): Promise<{ success: boolean; message: string }>;
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

  async ensureDefaultTeam(orgId: string): Promise<string> {
    if (!this.hasSupabase()) {
      return "team-default-1";
    }

    const adminClient = createAdminClient();
    const clientToUse = adminClient || createClient();

    // Check if an existing team exists for this org
    const { data: existingTeams } = await (clientToUse.from("teams") as any)
      .select("id, name")
      .eq("org_id", orgId)
      .limit(1);

    if (existingTeams && existingTeams.length > 0) {
      return existingTeams[0].id;
    }

    // Create default "General" team
    const { data: newTeam, error } = await (clientToUse.from("teams") as any)
      .insert({
        org_id: orgId,
        name: "General",
      })
      .select("id")
      .single();

    if (error || !newTeam) {
      console.warn("Could not create default team:", error?.message);
      return "11111111-1111-1111-1111-111111111111";
    }

    return newTeam.id;
  }

  async assignUserToTeam(userId: string, orgId: string, teamId?: string | null): Promise<string> {
    if (!this.hasSupabase()) {
      return teamId || "team-default-1";
    }

    const adminClient = createAdminClient();
    const clientToUse = adminClient || createClient();

    let targetTeamId = teamId;
    if (!targetTeamId) {
      targetTeamId = await this.ensureDefaultTeam(orgId);
    }

    try {
      await (clientToUse.from("team_members") as any).upsert(
        {
          user_id: userId,
          team_id: targetTeamId,
        },
        { onConflict: "team_id,user_id" }
      );
    } catch (err) {
      console.warn("Could not assign user to team_members:", err);
    }

    return targetTeamId;
  }

  async listOrgMembers(orgId: string): Promise<UserProfile[]> {
    if (!this.hasSupabase()) {
      return [
        { id: "mem-1", orgId, fullName: "Jane Doe (Admin)", email: "jane@acme.com", role: "admin", teamId: "team-1", teamName: "Leadership", avatarUrl: null, deletedAt: null },
        { id: "mem-2", orgId, fullName: "Alex Smith (Lead)", email: "alex@acme.com", role: "manager", teamId: "team-2", teamName: "Engineering", avatarUrl: null, deletedAt: null },
        { id: "mem-3", orgId, fullName: "Rohan Patel (Dev)", email: "rohan@acme.com", role: "employee", teamId: "team-2", teamName: "Engineering", avatarUrl: null, deletedAt: null },
      ];
    }

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Non-blocking
    }
    const clientToUse = adminClient || createClient();

    let { data: profiles } = await (clientToUse.from("profiles") as any)
      .select("id, org_id, full_name, role, avatar_url, notification_preferences, created_at, deleted_at")
      .or(`org_id.eq.${orgId},id.eq.${orgId}`)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    let finalProfiles: any[] = profiles || [];

    if (finalProfiles.length === 0) {
      const { data: allProfiles } = await (clientToUse.from("profiles") as any)
        .select("id, org_id, full_name, role, avatar_url, notification_preferences, created_at, deleted_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(50);
      if (allProfiles && allProfiles.length > 0) {
        finalProfiles = allProfiles;
      }
    }

    // Enrich with auth user emails and synthesize any unsynced auth users
    const authUserMap: Record<string, string> = {};
    if (adminClient?.auth?.admin) {
      try {
        const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 200 });
        if (authList?.users && authList.users.length > 0) {
          const profileIds = new Set(finalProfiles.map((p: any) => p.id));
          authList.users.forEach((u: any) => {
            if (u.id && u.email) {
              authUserMap[u.id] = u.email;
              if (!profileIds.has(u.id)) {
                finalProfiles.push({
                  id: u.id,
                  org_id: orgId,
                  full_name: u.user_metadata?.full_name || u.email.split("@")[0],
                  role: u.app_metadata?.role || u.user_metadata?.role || "employee",
                  avatar_url: null,
                  created_at: u.created_at,
                  deleted_at: null,
                });
              }
            }
          });
        }
      } catch {
        // Non-blocking
      }
    }

    if (!finalProfiles || finalProfiles.length === 0) {
      return [];
    }

    // Fetch team memberships and map to users
    const teamMemberMap: Record<string, { teamId: string; teamName: string }> = {};
    try {
      const { data: teamMemberships } = await (clientToUse.from("team_members") as any)
        .select(`
          user_id,
          team_id,
          teams:team_id (id, name)
        `);

      if (teamMemberships && Array.isArray(teamMemberships)) {
        teamMemberships.forEach((tm: any) => {
          if (tm.user_id && tm.team_id) {
            teamMemberMap[tm.user_id] = {
              teamId: tm.team_id,
              teamName: tm.teams?.name || "Assigned Team",
            };
          }
        });
      }
    } catch {
      // Non-blocking
    }

    return finalProfiles.map((p: any) => ({
      id: p.id,
      orgId: p.org_id,
      fullName: p.full_name || "Team Member",
      email: authUserMap[p.id] || undefined,
      role: p.role || "employee",
      teamId: teamMemberMap[p.id]?.teamId || null,
      teamName: teamMemberMap[p.id]?.teamName || null,
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
    creatorId: string,
    teamId?: string | null
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
          teamId: teamId || "team-default-1",
          teamName: "General",
          avatarUrl: null,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        },
      };
    }

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Non-blocking fallback
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user with this email already exists in Supabase Auth
    if (adminClient?.auth?.admin) {
      try {
        const { data: userList } = await adminClient.auth.admin.listUsers({ perPage: 500 });
        const existingUser = userList?.users?.find(
          (u: any) => u.email?.toLowerCase() === normalizedEmail
        );

        if (existingUser) {
          await adminClient.auth.admin.updateUserById(existingUser.id, {
            password,
            email_confirm: true,
            app_metadata: { role, org_id: orgId },
            user_metadata: { full_name: fullName, role, org_id: orgId },
          });

          await (adminClient.from("profiles") as any).upsert({
            id: existingUser.id,
            org_id: orgId,
            full_name: fullName,
            role,
            deleted_at: null,
          });

          const assignedTeamId = await this.assignUserToTeam(existingUser.id, orgId, teamId);

          return {
            user: existingUser,
            profile: {
              id: existingUser.id,
              orgId,
              fullName,
              email: existingUser.email || normalizedEmail,
              role,
              teamId: assignedTeamId,
              avatarUrl: null,
              createdAt: existingUser.created_at || new Date().toISOString(),
              deletedAt: null,
            },
          };
        }
      } catch (listErr) {
        console.warn("Could not check existing users via listUsers:", listErr);
      }
    }

    // 2. Create brand new user credentials
    let authUser: any = null;

    if (adminClient?.auth?.admin) {
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        app_metadata: { role, org_id: orgId },
        user_metadata: { full_name: fullName, role, org_id: orgId },
      });

      if (!createError && createData?.user) {
        authUser = createData.user;
      } else if (createError) {
        console.warn("admin.createUser error, trying client signUp fallback:", createError.message);
      }
    }

    // 3. Fallback: Client signUp
    if (!authUser) {
      const supabase = createClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            org_id: orgId,
          },
        },
      });

      if (!signUpError && signUpData?.user) {
        authUser = signUpData.user;
      } else if (signUpError) {
        const errMsg = signUpError.message.toLowerCase();
        if (errMsg.includes("already registered") || errMsg.includes("already exists")) {
          throw new ValidationError("An account with this email address already exists. Try another email or log in.");
        }
        if (errMsg.includes("rate limit") || errMsg.includes("rate_limit")) {
          throw new ValidationError(
            "Supabase Rate Limit Reached: To create employees without email rate limits, please copy the 'service_role (secret)' key (starts with eyJ...) from Supabase Dashboard -> Settings -> API Keys -> Legacy API Keys and set it as SUPABASE_SERVICE_ROLE_KEY in Render Environment Variables."
          );
        }
        if (errMsg.includes("user not allowed") || errMsg.includes("disabled")) {
          throw new ValidationError(
            "Supabase Auth Error: Email signups are disabled in your Supabase project or the Service Role Key on Render is invalid. Please verify SUPABASE_SERVICE_ROLE_KEY in Render Environment Variables and ensure Email provider is enabled in Supabase."
          );
        }
        throw new ValidationError(signUpError.message || "Failed to create user account.");
      }
    }

    if (!authUser) {
      throw new ValidationError("Failed to create user credentials. Please check your Supabase credentials.");
    }

    const userId = authUser.id;
    const dbClient = adminClient || createClient();

    // 4. Upsert profile in profiles table
    const { error: profileError } = await (dbClient.from("profiles") as any).upsert({
      id: userId,
      org_id: orgId,
      full_name: fullName,
      role,
      deleted_at: null,
    });

    if (profileError) {
      console.warn("Profile upsert warning:", profileError.message);
    }

    // 5. Invariant: Guarantee team assignment in team_members
    const assignedTeamId = await this.assignUserToTeam(userId, orgId, teamId);

    return {
      user: authUser,
      profile: {
        id: userId,
        orgId,
        fullName,
        email: normalizedEmail,
        role,
        teamId: assignedTeamId,
        avatarUrl: null,
        createdAt: authUser.created_at || new Date().toISOString(),
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
    inviterId: string,
    teamId?: string | null
  ): Promise<{ success: boolean; message: string }> {
    if (!this.hasSupabase()) {
      return { success: true, message: `Mock invite sent to ${email}` };
    }

    const adminClient = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${appUrl}/accept-invite`;

    // Ensure default team if teamId not passed
    const targetTeamId = teamId || (await this.ensureDefaultTeam(orgId));

    // Send single-use invite link via Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          org_id: orgId,
          role,
          team_id: targetTeamId,
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

      // Pre-assign user to team_members
      await this.assignUserToTeam(inviteData.user.id, orgId, targetTeamId);
    }

    return { success: true, message: `Invite dispatched successfully to ${email}` };
  }

  async acceptInvite(password: string): Promise<{ success: boolean }> {
    if (!this.hasSupabase()) {
      return { success: true };
    }

    const supabase = createClient();
    const { data: userData, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(error.message || "Failed to set account password.");
    }

    // Ensure team assignment on acceptance
    if (userData?.user?.id) {
      const orgId = userData.user.user_metadata?.org_id || userData.user.app_metadata?.org_id;
      const teamId = userData.user.user_metadata?.team_id || userData.user.app_metadata?.team_id;
      if (orgId) {
        await this.assignUserToTeam(userData.user.id, orgId, teamId);
      }
    }

    return { success: true };
  }
}

export const userRepository = new SupabaseUserRepository();

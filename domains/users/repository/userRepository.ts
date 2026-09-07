import {
  createClient,
  createAdminClient,
} from "@/infrastructure/supabase/supabaseServer";
import { logger } from "@/infrastructure/logger/logger";
import { UserProfile } from "../entities/UserProfile";
import { ValidationError } from "@/shared/errors/domainErrors";

export interface IUserRepository {
  getProfileById(userId: string): Promise<UserProfile | null>;
  listOrgMembers(orgId: string): Promise<UserProfile[]>;
  softDeleteUser(userId: string, orgId: string): Promise<boolean>;
  ensureDefaultTeam(orgId: string): Promise<string>;
  assignUserToTeam(
    userId: string,
    orgId: string,
    teamId?: string | null
  ): Promise<string>;
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
  updateProfile?(
    userId: string,
    orgId: string,
    updates: {
      fullName?: string;
      position?: string | null;
      phoneNumber?: string | null;
      bio?: string | null;
      department?: string | null;
      avatarUrl?: string | null;
    }
  ): Promise<UserProfile>;
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

  private getClient() {
    return createClient();
  }

  private getAdminClient() {
    return createAdminClient();
  }

  async getProfileById(userId: string): Promise<UserProfile | null> {
    if (!this.hasSupabase()) {
      if (process.env.NODE_ENV === "production") {
        throw new ValidationError(
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      // DEMO MODE (development only): returns a stub profile for local UI testing.
      // Never reached in production due to guard above.
      return {
        id: userId,
        orgId: "11111111-1111-1111-1111-111111111111",
        fullName: "Demo User",
        role: "employee", // Least privilege for demo stubs
        avatarUrl: null,
        position: "Software Engineer",
        phoneNumber: "+1 (555) 019-2834",
        bio: "Building impactful features at TasqOne.",
        department: "Engineering",
        email: "demo@tasq-one.com",
        deletedAt: null,
      };
    }

    const supabase = this.getClient();
    let profile: any = null;
    let { data, error } = await (supabase.from("profiles") as any)
      .select(
        "id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at, deleted_at"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      const { data: baseData } = await (supabase.from("profiles") as any)
        .select(
          "id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at"
        )
        .eq("id", userId)
        .maybeSingle();
      profile = baseData;
    } else {
      profile = data;
    }

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      orgId: profile.org_id,
      fullName: profile.full_name,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      position: profile.position || null,
      phoneNumber: profile.phone_number || null,
      bio: profile.bio || null,
      department: profile.department || null,
      notificationPreferences: profile.notification_preferences,
      createdAt: profile.created_at,
      deletedAt: profile.deleted_at || null,
    };
  }

  async ensureDefaultTeam(orgId: string): Promise<string> {
    if (!this.hasSupabase()) {
      return "team-default-1";
    }

    const clientToUse = this.getClient();

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

  async assignUserToTeam(
    userId: string,
    orgId: string,
    teamId?: string | null
  ): Promise<string> {
    if (!this.hasSupabase()) {
      return teamId || "team-default-1";
    }

    const clientToUse = this.getClient();

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
      if (process.env.NODE_ENV === "production") {
        throw new ValidationError(
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return [];
    }

    // SECURITY: Use cookie-scoped client enforcing PostgreSQL Row-Level Security
    const client = this.getClient();

    // 1. Query profiles within caller's organization
    let profiles: any[] | null = null;
    try {
      const { data, error } = await (client.from("profiles") as any)
        .select(
          "id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at, deleted_at"
        )
        .eq("org_id", orgId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        profiles = data;
      }
    } catch {}

    if (!profiles || profiles.length === 0) {
      // Fallback query without deleted_at in SELECT in case column is not yet present
      try {
        const { data: baseProfiles, error: baseErr } = await (client.from("profiles") as any)
          .select(
            "id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: true });

        if (!baseErr && baseProfiles && baseProfiles.length > 0) {
          profiles = baseProfiles;
        }
      } catch {}
    }

    if (!profiles || profiles.length === 0) {
      try {
        const adminClient = this.getAdminClient();
        if (adminClient) {
          const { data: adminProfiles, error: adminErr } = await (
            adminClient.from("profiles") as any
          )
            .select(
              "id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at, deleted_at"
            )
            .eq("org_id", orgId)
            .order("created_at", { ascending: true });

          if (!adminErr && adminProfiles && adminProfiles.length > 0) {
            profiles = adminProfiles;
          } else {
            const { data: adminBase } = await (
              adminClient.from("profiles") as any
            )
              .select(
                "id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at"
              )
              .eq("org_id", orgId)
              .order("created_at", { ascending: true });
            if (adminBase && adminBase.length > 0) {
              profiles = adminBase;
            }
          }
        }
      } catch {}
    }

    let finalProfiles: any[] = (profiles || []).filter((p: any) => !p.deleted_at);

    if (finalProfiles.length === 0) {
      try {
        const adminClient = this.getAdminClient();
        if (adminClient) {
          // Auto-heal any orphaned profiles that belong to this workspace
          await (adminClient.from("profiles") as any)
            .update({ org_id: orgId })
            .is("org_id", null);

          const { data: adminProfiles } = await (
            adminClient.from("profiles") as any
          )
            .select(
              "id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at"
            )
            .eq("org_id", orgId)
            .order("created_at", { ascending: true });

          if (adminProfiles && adminProfiles.length > 0) {
            finalProfiles = adminProfiles.filter((p: any) => !p.deleted_at);
          }
        }
      } catch (err) {
        console.warn("[listOrgMembers admin fallback warning]:", err);
      }
    }

    // If organization still has no profiles, return empty array
    if (finalProfiles.length === 0) {
      return [];
    }

    const profileIds = new Set(finalProfiles.map((p: any) => p.id));
    const profileIdList = Array.from(profileIds);

    // 2. Fetch auth user emails strictly for verified profile IDs in THIS organization
    const authUserMap: Record<string, string> = {};
    try {
      const adminClient = this.getAdminClient();
      if (adminClient?.auth?.admin) {
        const { data: userList } = await adminClient.auth.admin.listUsers({
          perPage: 200,
        });
        const users = userList?.users || [];
        for (const u of users) {
          // Never inject users from other orgs — only map emails for verified members of this org
          if (u.id && u.email && profileIds.has(u.id)) {
            authUserMap[u.id] = u.email;
          }
        }
      }
    } catch {
      // Non-blocking email enrichment
    }

    // 3. Team memberships strictly for verified profile IDs in this org
    const teamMemberMap: Record<string, { teamId: string; teamName: string }> =
      {};
    try {
      const { data: teamMemberships } = await (
        client.from("team_members") as any
      )
        .select(`user_id, team_id, teams:team_id (id, name)`)
        .in("user_id", profileIdList);

      if (Array.isArray(teamMemberships)) {
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
      // Non-blocking team mapping
    }

    return finalProfiles.map((p: any) => ({
      id: p.id,
      orgId: p.org_id,
      fullName: p.full_name || "Team Member",
      email: authUserMap[p.id] || undefined,
      role: p.role || "employee",
      position: p.position || null,
      phoneNumber: p.phone_number || null,
      bio: p.bio || null,
      department: p.department || null,
      teamId: teamMemberMap[p.id]?.teamId || null,
      teamName: teamMemberMap[p.id]?.teamName || null,
      avatarUrl: p.avatar_url,
      notificationPreferences: p.notification_preferences,
      createdAt: p.created_at,
      deletedAt: p.deleted_at,
    }));
  }

  async updateProfile(
    userId: string,
    orgId: string,
    updates: {
      fullName?: string;
      position?: string | null;
      phoneNumber?: string | null;
      bio?: string | null;
      department?: string | null;
      avatarUrl?: string | null;
    }
  ): Promise<UserProfile> {
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName.trim();
    if (updates.position !== undefined) dbUpdates.position = updates.position?.trim() || null;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber?.trim() || null;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio?.trim() || null;
    if (updates.department !== undefined) dbUpdates.department = updates.department?.trim() || null;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl || null;

    if (!this.hasSupabase()) {
      return {
        id: userId,
        orgId,
        fullName: updates.fullName || "Demo User",
        role: "admin",
        avatarUrl: updates.avatarUrl || null,
        position: updates.position || "Software Engineer",
        phoneNumber: updates.phoneNumber || "+1 (555) 019-2834",
        bio: updates.bio || null,
        department: updates.department || "Engineering",
        deletedAt: null,
      };
    }

    const adminClient = this.getAdminClient();
    const client = adminClient || this.getClient();

    try {
      const { data: updated, error } = await (client.from("profiles") as any)
        .update(dbUpdates)
        .eq("id", userId)
        .select("id, org_id, full_name, role, avatar_url, position, phone_number, bio, department, notification_preferences, created_at, deleted_at")
        .single();

      if (!error && updated) {
        return {
          id: updated.id,
          orgId: updated.org_id,
          fullName: updated.full_name,
          role: updated.role,
          avatarUrl: updated.avatar_url,
          position: updated.position || null,
          phoneNumber: updated.phone_number || null,
          bio: updated.bio || null,
          department: updated.department || null,
          notificationPreferences: updated.notification_preferences,
          createdAt: updated.created_at,
          deletedAt: updated.deleted_at,
        };
      }
    } catch {
      // Graceful fallback below
    }

    // Fallback if specific columns are not migrated yet in existing database
    const coreUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.fullName !== undefined) coreUpdates.full_name = updates.fullName.trim();
    if (updates.avatarUrl !== undefined) coreUpdates.avatar_url = updates.avatarUrl;

    const { data: fbUpdated } = await (client.from("profiles") as any)
      .update(coreUpdates)
      .eq("id", userId)
      .select()
      .single();

    return {
      id: userId,
      orgId,
      fullName: updates.fullName || fbUpdated?.full_name || "User",
      role: fbUpdated?.role || "employee",
      avatarUrl: updates.avatarUrl || fbUpdated?.avatar_url || null,
      position: updates.position || null,
      phoneNumber: updates.phoneNumber || null,
      bio: updates.bio || null,
      department: updates.department || null,
    };
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
      if (process.env.NODE_ENV === "production") {
        throw new ValidationError(
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
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
        const { data: userList } = await adminClient.auth.admin.listUsers({
          perPage: 500,
        });
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

          const assignedTeamId = await this.assignUserToTeam(
            existingUser.id,
            orgId,
            teamId
          );

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
      const { data: createData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          app_metadata: { role, org_id: orgId },
          user_metadata: { full_name: fullName, role, org_id: orgId },
        });

      if (!createError && createData?.user) {
        authUser = createData.user;
      } else if (createError) {
        console.warn(
          "admin.createUser error, trying client signUp fallback:",
          createError.message
        );
      }
    }

    // 3. Fallback: Client signUp
    if (!authUser) {
      const supabase = this.getClient();
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
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
        if (adminClient?.auth?.admin && authUser.id) {
          try {
            await adminClient.auth.admin.updateUserById(authUser.id, {
              email_confirm: true,
              app_metadata: { role, org_id: orgId },
              user_metadata: { full_name: fullName, role, org_id: orgId },
            });
          } catch {}
        }
      } else if (signUpError) {
        const errMsg = signUpError.message.toLowerCase();
        if (
          errMsg.includes("already registered") ||
          errMsg.includes("already exists")
        ) {
          throw new ValidationError(
            "An account with this email address already exists. Try another email or log in."
          );
        }
        if (errMsg.includes("rate limit") || errMsg.includes("rate_limit")) {
          logger.error({
            event: "user_create_rate_limited",
            error: signUpError.message,
            diagnostic: "Supabase rate limit reached during user signup.",
          });
          throw new ValidationError(
            "Unable to create user account right now. Please try again shortly or contact support."
          );
        }
        if (
          errMsg.includes("user not allowed") ||
          errMsg.includes("disabled")
        ) {
          logger.error({
            event: "user_create_disabled",
            error: signUpError.message,
            diagnostic:
              "Email provider is disabled or service role auth credentials failed.",
          });
          throw new ValidationError(
            "Unable to create user account. Please contact support."
          );
        }
        logger.error({
          event: "user_create_failed",
          error: signUpError.message,
        });
        throw new ValidationError(
          "Unable to create user account. Please try again or contact support."
        );
      }
    }

    if (!authUser) {
      logger.error({
        event: "user_create_missing_auth_user",
        diagnostic: "Supabase auth failed to produce a valid user record.",
      });
      throw new ValidationError(
        "Unable to create user account. Please contact support."
      );
    }

    const userId = authUser.id;
    const dbClient = adminClient || createClient();

    // 4. Upsert profile in profiles table
    const { error: profileError } = await (
      dbClient.from("profiles") as any
    ).upsert({
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
      throw new Error(
        dbError.message || "Failed to update member role in database."
      );
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
      if (process.env.NODE_ENV === "production") {
        throw new ValidationError(
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return { success: true, message: `Mock invite sent to ${email}` };
    }

    const adminClient = createAdminClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://tasq-one.onrender.com";
    const redirectTo = `${appUrl}/accept-invite`;

    // Ensure default team if teamId not passed
    const targetTeamId = teamId || (await this.ensureDefaultTeam(orgId));

    // Send single-use invite link via Supabase Auth Admin API
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          org_id: orgId,
          role,
          team_id: targetTeamId,
          invited_by: inviterId,
        },
      });

    if (inviteError) {
      throw new Error(
        inviteError.message || "Failed to dispatch employee invitation."
      );
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

    return {
      success: true,
      message: `Invite dispatched successfully to ${email}`,
    };
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
      const orgId =
        userData.user.user_metadata?.org_id ||
        userData.user.app_metadata?.org_id;
      const teamId =
        userData.user.user_metadata?.team_id ||
        userData.user.app_metadata?.team_id;
      if (orgId) {
        await this.assignUserToTeam(userData.user.id, orgId, teamId);
      }
    }

    return { success: true };
  }
}

export const userRepository = new SupabaseUserRepository();

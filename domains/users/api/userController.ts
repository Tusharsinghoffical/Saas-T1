import { requireAuth, requireRole } from "@/shared/middleware/rbacGuard";
import { listOrgMembersUseCase } from "../usecases/listOrgMembers";
import { getUserProfileUseCase } from "../usecases/getUserProfile";
import { inviteUserUseCase, InviteUserInput } from "../usecases/inviteUser";
import {
  createEmployeeUserUseCase,
  CreateEmployeeInput,
} from "../usecases/createEmployeeUser";
import {
  updateUserRoleUseCase,
  UpdateUserRoleInput,
} from "../usecases/updateUserRole";
import { acceptInviteUseCase } from "../usecases/acceptInvite";
import { removeUserUseCase } from "../usecases/removeUser";
import { checkRateLimit } from "@/infrastructure/redis/redisClient";
import { RateLimitError, NotFoundError } from "@/shared/errors/domainErrors";
import { headers as nextHeaders } from "next/headers";

async function getClientIp(): Promise<string> {
  try {
    const headerList = await nextHeaders();
    return (
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export class UserController {
  async getMembers() {
    const auth = await requireAuth();
    return await listOrgMembersUseCase(auth);
  }

  async getProfile(userId: string) {
    const auth = await requireAuth();
    const { userRepository } = await import("../repository/userRepository");
    const profile = await getUserProfileUseCase(userId);
    // SECURITY: Verify the requested profile belongs to the caller's org
    if (!profile || (profile as any).orgId !== auth.orgId) {
      throw new NotFoundError("Member not found in your organization.");
    }
    return profile;
  }

  async createMember(input: CreateEmployeeInput) {
    const auth = await requireAuth();

    const ip = await getClientIp();
    const rateLimitKey = `ratelimit:create-member:${auth.orgId}:${ip}`;
    const rl = await checkRateLimit(rateLimitKey, 20, 300);
    if (!rl.success) {
      throw new RateLimitError(
        `Too many user creation requests. Please retry in ${Math.ceil(rl.resetInSeconds / 60)} minute(s).`,
        rl.resetInSeconds
      );
    }

    return await createEmployeeUserUseCase(auth, input);
  }

  async updateRole(userId: string, role: "admin" | "manager" | "employee") {
    const auth = await requireAuth();
    return await updateUserRoleUseCase(auth, { userId, role });
  }

  async updateMember(
    userId: string,
    updates: {
      role?: "admin" | "manager" | "employee";
      teamId?: string;
      teamName?: string;
      fullName?: string;
      position?: string | null;
      department?: string | null;
      phoneNumber?: string | null;
      bio?: string | null;
    }
  ) {
    const auth = await requireRole(["admin", "manager"]);
    const { userRepository } = await import("../repository/userRepository");

    const targetUser = await userRepository.getProfileById(userId);
    if (!targetUser || targetUser.orgId !== auth.orgId) {
      throw new NotFoundError("Member not found in your organization.");
    }

    // 1. Role update
    if (updates.role && updates.role !== targetUser.role) {
      await updateUserRoleUseCase(auth, { userId, role: updates.role });
    }

    // 2. Profile metadata updates (fullName, position, department, phoneNumber, bio)
    const profileUpdates: Record<string, any> = {};
    if (updates.fullName !== undefined) profileUpdates.fullName = updates.fullName.trim();
    if (updates.position !== undefined) profileUpdates.position = updates.position ? updates.position.trim() : null;
    if (updates.department !== undefined) profileUpdates.department = updates.department ? updates.department.trim() : null;
    if (updates.phoneNumber !== undefined) profileUpdates.phoneNumber = updates.phoneNumber ? updates.phoneNumber.trim() : null;
    if (updates.bio !== undefined) profileUpdates.bio = updates.bio ? updates.bio.trim() : null;

    if (Object.keys(profileUpdates).length > 0) {
      await userRepository.updateProfile(userId, auth.orgId, profileUpdates);
    }

    // 3. Team Assignment
    let resolvedTeamId = updates.teamId;

    if (!resolvedTeamId && updates.teamName) {
      // Look up or create team by name in the org
      const { createAdminClient } =
        await import("@/infrastructure/supabase/supabaseServer");
      const adminClient = createAdminClient();
      const clientToUse = adminClient;

      const teamName = updates.teamName.trim();

      // Try to find existing team with this name
      const { data: existing } = await (clientToUse.from("teams") as any)
        .select("id")
        .eq("org_id", auth.orgId)
        .ilike("name", teamName)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        resolvedTeamId = existing.id;
      } else {
        // Create the team on-the-fly
        const { data: created } = await (clientToUse.from("teams") as any)
          .insert({ org_id: auth.orgId, name: teamName })
          .select("id")
          .single();
        resolvedTeamId = created?.id ?? undefined;
      }
    }

    if (resolvedTeamId) {
      await userRepository.assignUserToTeam(userId, auth.orgId, resolvedTeamId);
    }

    // 4. Invalidate Redis caches so member lists immediately reflect fresh data everywhere
    try {
      const { redisDel } = await import("@/infrastructure/redis/redisClient");
      await redisDel(`members:${auth.orgId}`);
      await redisDel(`profile:${userId}`);
    } catch {}

    // 5. Record activity audit trail for compliance
    try {
      const { activityRepository } = await import("@/domains/activity/repository/activityRepository");
      await activityRepository.recordLog({
        orgId: auth.orgId,
        actorId: auth.userId,
        action: "member.updated",
        entity: "profiles",
        entityId: userId,
        diff: {
          memberName: updates.fullName || targetUser.fullName,
          updatedFields: Object.keys({
            ...profileUpdates,
            ...(updates.role ? { role: updates.role } : {}),
            ...(updates.teamName ? { teamName: updates.teamName } : {}),
          }),
          position: updates.position !== undefined ? updates.position : targetUser.position,
          role: updates.role || targetUser.role,
          teamName: updates.teamName || targetUser.teamName,
        },
      });
    } catch {
      // Non-blocking audit
    }

    // Fetch refreshed profile to return complete representation
    const freshProfile = await userRepository.getProfileById(userId);
    return { success: true, data: freshProfile };
  }

  async inviteMember(input: InviteUserInput) {
    const auth = await requireAuth();

    // Rate limiting on invite generation (10 per 5 mins per org/IP)
    const ip = await getClientIp();
    const rateLimitKey = `ratelimit:invite:${auth.orgId}:${ip}`;
    const rl = await checkRateLimit(rateLimitKey, 10, 300);
    if (!rl.success) {
      throw new RateLimitError(
        `Too many invite requests. Please retry in ${Math.ceil(rl.resetInSeconds / 60)} minute(s).`,
        rl.resetInSeconds
      );
    }

    return await inviteUserUseCase(auth, input);
  }

  async acceptInvite(password: string) {
    // Rate limiting on invite acceptance (5 per 5 mins per IP)
    const ip = await getClientIp();
    const rateLimitKey = `ratelimit:accept-invite:${ip}`;
    const rl = await checkRateLimit(rateLimitKey, 5, 300);
    if (!rl.success) {
      throw new RateLimitError(
        `Too many invite-acceptance attempts. Please retry in ${Math.ceil(rl.resetInSeconds / 60)} minute(s).`,
        rl.resetInSeconds
      );
    }

    return await acceptInviteUseCase(password);
  }

  async removeMember(targetUserId: string) {
    const auth = await requireAuth();
    return await removeUserUseCase(auth, targetUserId);
  }

  async getPersonalProfile() {
    const auth = await requireAuth();
    const { userRepository } = await import("../repository/userRepository");
    const profile = await userRepository.getProfileById(auth.userId);
    if (!profile) {
      throw new NotFoundError("Profile not found.");
    }
    return {
      ...profile,
      email: profile.email || auth.email,
    };
  }

  async updatePersonalProfile(updates: {
    fullName?: string;
    position?: string | null;
    phoneNumber?: string | null;
    bio?: string | null;
    department?: string | null;
    avatarUrl?: string | null;
  }) {
    const auth = await requireAuth();
    const { userRepository } = await import("../repository/userRepository");
    const updated = await userRepository.updateProfile(auth.userId, auth.orgId, updates);

    // Invalidate Redis caches so organization member rosters immediately reflect the new profile
    try {
      const { redisDel } = await import("@/infrastructure/redis/redisClient");
      await redisDel(`members:${auth.orgId}`);
      await redisDel(`profile:${auth.userId}`);
    } catch {}

    // Record activity audit trail
    try {
      const { activityRepository } = await import("@/domains/activity/repository/activityRepository");
      await activityRepository.recordLog({
        orgId: auth.orgId,
        actorId: auth.userId,
        action: "member.profile_updated",
        entity: "profiles",
        entityId: auth.userId,
        diff: {
          updatedFields: Object.keys(updates),
          position: updates.position,
          fullName: updates.fullName,
          department: updates.department,
        },
      });
    } catch {
      // Non-blocking audit
    }

    return {
      ...updated,
      email: updated.email || auth.email,
    };
  }
}

export const userController = new UserController();

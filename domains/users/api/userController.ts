import { requireAuth } from "@/shared/middleware/rbacGuard";
import { listOrgMembersUseCase } from "../usecases/listOrgMembers";
import { getUserProfileUseCase } from "../usecases/getUserProfile";
import { inviteUserUseCase, InviteUserInput } from "../usecases/inviteUser";
import { createEmployeeUserUseCase, CreateEmployeeInput } from "../usecases/createEmployeeUser";
import { updateUserRoleUseCase, UpdateUserRoleInput } from "../usecases/updateUserRole";
import { acceptInviteUseCase } from "../usecases/acceptInvite";
import { removeUserUseCase } from "../usecases/removeUser";
import { checkRateLimit } from "@/infrastructure/redis/redisClient";
import { RateLimitError } from "@/shared/errors/domainErrors";
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
    await requireAuth();
    return await getUserProfileUseCase(userId);
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
}

export const userController = new UserController();

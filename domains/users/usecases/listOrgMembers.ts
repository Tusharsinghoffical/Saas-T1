import { RequestContext } from "@/shared/types/context";
import { UserProfile } from "../entities/UserProfile";
import { IUserRepository, userRepository } from "../repository/userRepository";
import { redisGet, redisSet } from "@/infrastructure/redis/redisClient";

export async function listOrgMembersUseCase(
  context: RequestContext,
  repo: IUserRepository = userRepository
): Promise<UserProfile[]> {
  // Cache members for 20 seconds per org (eliminates repeated Supabase auth.admin.listUsers calls)
  const cacheKey = `members:${context.orgId}`;
  const cached = await redisGet<UserProfile[]>(cacheKey);
  let allMembers: UserProfile[];

  if (cached && Array.isArray(cached) && cached.length > 0) {
    allMembers = cached;
  } else {
    allMembers = await repo.listOrgMembers(context.orgId);
    // Cache for 20 seconds — short enough for near-real-time updates
    await redisSet(cacheKey, allMembers, 20);
  }

  // If requester is a manager, scope members to their own team(s)
  if (context.role === "manager") {
    const currentManager = allMembers.find((m) => m.id === context.userId);
    const managerTeamId = currentManager?.teamId;

    if (!managerTeamId) {
      return allMembers;
    }

    const teamMembers = allMembers.filter(
      (m) => m.id === context.userId || m.teamId === managerTeamId || !m.teamId
    );
    return teamMembers.length > 0 ? teamMembers : allMembers;
  }

  // Admin and other authorized roles see full organization members
  return allMembers;
}

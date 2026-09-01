import { RequestContext } from "@/shared/types/context";
import { UserProfile } from "../entities/UserProfile";
import { IUserRepository, userRepository } from "../repository/userRepository";

export async function listOrgMembersUseCase(
  context: RequestContext,
  repo: IUserRepository = userRepository
): Promise<UserProfile[]> {
  const allMembers = await repo.listOrgMembers(context.orgId);

  // If requester is a manager, scope members to their own team(s)
  if (context.role === "manager") {
    const currentManager = allMembers.find((m) => m.id === context.userId);
    const managerTeamId = currentManager?.teamId;

    if (!managerTeamId) {
      // If manager has no specific team assigned, return only themselves
      return allMembers.filter((m) => m.id === context.userId);
    }

    return allMembers.filter(
      (m) => m.id === context.userId || m.teamId === managerTeamId
    );
  }

  // Admin and other authorized roles see full organization members
  return allMembers;
}

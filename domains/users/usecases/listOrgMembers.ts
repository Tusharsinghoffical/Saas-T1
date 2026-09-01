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
      // If manager has not been mapped to a custom squad, return all org members in default team or workspace
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

import { RequestContext } from "@/shared/types/context";
import { UserProfile } from "../entities/UserProfile";
import { IUserRepository, userRepository } from "../repository/userRepository";

export async function listOrgMembersUseCase(
  context: RequestContext,
  repo: IUserRepository = userRepository
): Promise<UserProfile[]> {
  return await repo.listOrgMembers(context.orgId);
}

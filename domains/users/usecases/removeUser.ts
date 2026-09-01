import { RequestContext } from "@/shared/types/context";
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors/domainErrors";
import { IUserRepository, userRepository } from "../repository/userRepository";
import { recordActivityLogUseCase } from "@/domains/activity";

export async function removeUserUseCase(
  context: RequestContext,
  targetUserId: string,
  repo: IUserRepository = userRepository
): Promise<{ success: boolean; message: string }> {
  // 1. Employee cannot remove anyone
  if (context.role === "employee") {
    throw new ForbiddenError("Employees are not authorized to remove team members.");
  }

  // 2. Cannot remove self
  if (context.userId === targetUserId) {
    throw new ValidationError("You cannot remove your own account from the workspace.");
  }

  // 3. Fetch target profile
  const targetUser = await repo.getProfileById(targetUserId);
  if (!targetUser || targetUser.orgId !== context.orgId) {
    throw new NotFoundError("Team member not found in this organization.");
  }

  // 4. Manager cannot remove admin or manager
  if (context.role === "manager" && (targetUser.role === "admin" || targetUser.role === "manager")) {
    throw new ForbiddenError("Managers can only remove members with the 'employee' role.");
  }

  // 5. Perform soft delete
  await repo.softDeleteUser(targetUserId, context.orgId);

  // Audit log
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "member.removed",
    entity: "profiles",
    entityId: targetUserId,
    diff: {
      fullName: targetUser.fullName,
      email: targetUser.email,
      role: targetUser.role,
    },
  }).catch(() => {});

  return {
    success: true,
    message: `${targetUser.fullName || targetUser.email || "Member"} has been deactivated.`,
  };
}


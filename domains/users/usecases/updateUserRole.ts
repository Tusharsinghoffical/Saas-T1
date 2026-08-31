import { RequestContext } from "@/shared/types/context";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";
import { IUserRepository, userRepository } from "../repository/userRepository";

export interface UpdateUserRoleInput {
  userId: string;
  role: "admin" | "manager" | "employee";
}

export async function updateUserRoleUseCase(
  context: RequestContext,
  input: UpdateUserRoleInput,
  repo: IUserRepository = userRepository
): Promise<{ success: boolean; message: string }> {
  // 1. Only admins can modify user roles
  if (context.role !== "admin") {
    throw new ForbiddenError("Only workspace administrators can modify member roles.");
  }

  if (!input.userId) {
    throw new ValidationError("User ID is required.");
  }

  if (!["admin", "manager", "employee"].includes(input.role)) {
    throw new ValidationError("Invalid role specified.");
  }

  // Admin cannot demote themselves accidentally
  if (input.userId === context.userId && input.role !== "admin") {
    throw new ValidationError("You cannot demote your own admin account.");
  }

  await repo.updateUserRole(input.userId, context.orgId, input.role);

  return {
    success: true,
    message: `Role successfully updated to ${input.role}.`,
  };
}

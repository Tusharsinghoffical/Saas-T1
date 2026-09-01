import { RequestContext } from "@/shared/types/context";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";
import { IUserRepository, userRepository } from "../repository/userRepository";

export interface InviteUserInput {
  email: string;
  role: "admin" | "manager" | "employee";
  teamId?: string | null;
}

export async function inviteUserUseCase(
  context: RequestContext,
  input: InviteUserInput,
  repo: IUserRepository = userRepository
): Promise<{ success: boolean; message: string }> {
  const inviterRole = context.role;

  // 1. Employee cannot invite anyone
  if (inviterRole === "employee") {
    throw new ForbiddenError("Employees are not authorized to invite team members.");
  }

  // 2. Manager can ONLY invite employees (cannot invite admin or manager)
  if (inviterRole === "manager" && input.role !== "employee") {
    throw new ForbiddenError("Managers can only invite team members with the 'employee' role.");
  }

  // 3. Validate email
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new ValidationError("A valid email address is required.");
  }

  // 4. Dispatch invite with server-enforced orgId & role & teamId
  return await repo.inviteUser(
    context.orgId,
    input.email.trim().toLowerCase(),
    input.role,
    context.userId,
    input.teamId
  );
}

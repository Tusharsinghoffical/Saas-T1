import { RequestContext } from "@/shared/types/context";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";
import { IUserRepository, userRepository } from "../repository/userRepository";
import { UserProfile } from "../entities/UserProfile";
import { recordActivityLogUseCase } from "@/domains/activity";

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  password?: string;
  role: "admin" | "manager" | "employee";
  teamId?: string | null;
}

export async function createEmployeeUserUseCase(
  context: RequestContext,
  input: CreateEmployeeInput,
  repo: IUserRepository = userRepository
): Promise<{ user: any; profile: UserProfile; message: string }> {
  // 1. Only admin and manager can create/add members
  if (context.role === "employee") {
    throw new ForbiddenError("Employees are not authorized to create or invite team members.");
  }

  // 2. Managers cannot create admins or other managers
  if (context.role === "manager" && input.role !== "employee") {
    throw new ForbiddenError("Managers can only add team members with the 'employee' role.");
  }

  // 3. Validation
  if (!input.fullName || input.fullName.trim().length < 2) {
    throw new ValidationError("Full Name must be at least 2 characters.");
  }

  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new ValidationError("A valid email address is required.");
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.fullName.trim();

  // 4. If password is provided, create direct login credentials
  if (input.password && input.password.length >= 6) {
    const result = await repo.createUserWithPassword(
      context.orgId,
      cleanEmail,
      input.password,
      cleanName,
      input.role,
      context.userId,
      input.teamId
    );

    // Audit log
    await recordActivityLogUseCase({
      orgId: context.orgId,
      actorId: context.userId,
      action: "member.created",
      entity: "profiles",
      entityId: result.profile.id,
      diff: {
        fullName: cleanName,
        email: cleanEmail,
        role: input.role,
      },
    }).catch(() => {});

    return {
      user: result.user,
      profile: result.profile,
      message: `Account created for ${cleanName} (${cleanEmail}). They can now log in immediately with their credentials.`,
    };
  }

  // 5. Otherwise, dispatch email invitation
  const inviteResult = await repo.inviteUser(
    context.orgId,
    cleanEmail,
    input.role,
    context.userId,
    input.teamId
  );

  // Audit log
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "member.invited",
    entity: "profiles",
    diff: {
      fullName: cleanName,
      email: cleanEmail,
      role: input.role,
    },
  }).catch(() => {});

  return {
    user: null,
    profile: {
      id: "pending-" + Date.now(),
      orgId: context.orgId,
      fullName: cleanName,
      email: cleanEmail,
      role: input.role,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    },
    message: inviteResult.message,
  };
}


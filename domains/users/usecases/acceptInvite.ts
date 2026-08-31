import { ValidationError } from "@/shared/errors/domainErrors";
import { IUserRepository, userRepository } from "../repository/userRepository";

export async function acceptInviteUseCase(
  password: string,
  repo: IUserRepository = userRepository
): Promise<{ success: boolean }> {
  if (!password || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError("Password must contain at least one uppercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    throw new ValidationError("Password must contain at least one number.");
  }

  return await repo.acceptInvite(password);
}

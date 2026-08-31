import { ValidationError } from "@/shared/errors/domainErrors";
import { IUserRepository, userRepository } from "../repository/userRepository";

export async function acceptInviteUseCase(
  password: string,
  repo: IUserRepository = userRepository
): Promise<{ success: boolean }> {
  if (!password || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }

  return await repo.acceptInvite(password);
}

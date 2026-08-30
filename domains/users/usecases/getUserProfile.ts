import { UserProfile } from "../entities/UserProfile";
import { IUserRepository, userRepository } from "../repository/userRepository";
import { NotFoundError } from "@/shared/errors/domainErrors";

export async function getUserProfileUseCase(
  userId: string,
  repo: IUserRepository = userRepository
): Promise<UserProfile> {
  const profile = await repo.getProfileById(userId);
  if (!profile) {
    throw new NotFoundError("User profile not found.");
  }
  return profile;
}

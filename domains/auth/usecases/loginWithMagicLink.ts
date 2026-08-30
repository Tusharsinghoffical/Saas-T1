import { IAuthRepository, authRepository } from "../repository/authRepository";

export async function loginWithMagicLinkUseCase(
  email: string,
  redirectTo: string,
  repo: IAuthRepository = authRepository
): Promise<{ message: string }> {
  await repo.loginMagicLink(email, redirectTo);
  return {
    message: `Magic link sent to ${email}! Check your inbox to sign in.`,
  };
}

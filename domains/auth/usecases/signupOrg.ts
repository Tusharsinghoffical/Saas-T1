import { SignupCredentials } from "../entities/AuthSession";
import { IAuthRepository, authRepository } from "../repository/authRepository";

export async function signupOrgUseCase(
  input: SignupCredentials,
  repo: IAuthRepository = authRepository
): Promise<{ orgId: string; orgName: string; userId: string }> {
  const result = await repo.signupAdmin(input);
  return {
    orgId: result.orgId,
    orgName: input.orgName,
    userId: result.userId,
  };
}

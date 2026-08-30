import { OnboardingData } from "../entities/AuthSession";
import { IAuthRepository, authRepository } from "../repository/authRepository";

export async function completeOnboardingUseCase(
  input: OnboardingData,
  repo: IAuthRepository = authRepository
): Promise<{ redirectUrl: string }> {
  if (input.orgId && input.taskTitle) {
    await repo.createInitialTask(
      input.orgId,
      input.taskTitle,
      input.priority,
      input.dueDate || null
    );
  }

  return {
    redirectUrl: "/admin/dashboard",
  };
}

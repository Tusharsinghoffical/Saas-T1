import { RequestContext } from "@/shared/types/context";
import { Task, TaskFilterDTO } from "../entities/Task";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { userRepository, IUserRepository } from "@/domains/users/repository/userRepository";

export async function listTasksUseCase(
  context: RequestContext,
  filters: TaskFilterDTO,
  repo: ITaskRepository = taskRepository,
  userRepo: IUserRepository = userRepository
): Promise<{ tasks: Task[]; total: number }> {
  // If manager, enforce manager team scoping
  if (context.role === "manager" && !filters.teamId) {
    try {
      const profile = await userRepo.getProfileById(context.userId);
      if (profile?.teamId) {
        filters = { ...filters, teamId: profile.teamId };
      }
    } catch {
      // Non-blocking
    }
  }

  return await repo.listTasks(context.orgId, filters);
}

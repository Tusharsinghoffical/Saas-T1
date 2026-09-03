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

  let result = await repo.listTasks(context.orgId, filters);
  if (
    result.tasks.length === 0 &&
    !filters.search &&
    !filters.status &&
    !filters.priority &&
    !filters.teamId
  ) {
    try {
      const { seedWorkspaceDataUseCase } = await import("./seedWorkspaceData");
      const seedResult = await seedWorkspaceDataUseCase(context.orgId, context.userId);
      if (seedResult.success && seedResult.tasksCount > 0) {
        result = await repo.listTasks(context.orgId, filters);
      }
    } catch (seedErr) {
      console.warn("[listTasksUseCase auto-seed warning]:", seedErr);
    }
  }

  return result;
}

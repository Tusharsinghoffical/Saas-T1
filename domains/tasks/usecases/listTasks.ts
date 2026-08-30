import { RequestContext } from "@/shared/types/context";
import { Task, TaskFilterDTO } from "../entities/Task";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";

export async function listTasksUseCase(
  context: RequestContext,
  filters: TaskFilterDTO,
  repo: ITaskRepository = taskRepository
): Promise<{ tasks: Task[]; total: number }> {
  return await repo.listTasks(context.orgId, filters);
}

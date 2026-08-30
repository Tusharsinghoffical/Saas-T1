import { RequestContext } from "@/shared/types/context";
import { Task } from "../entities/Task";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { NotFoundError } from "@/shared/errors/domainErrors";

export async function getTaskByIdUseCase(
  context: RequestContext,
  taskId: string,
  repo: ITaskRepository = taskRepository
): Promise<Task> {
  const task = await repo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new NotFoundError("Task not found.");
  }
  return task;
}

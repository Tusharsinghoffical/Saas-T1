import { RequestContext } from "@/shared/types/context";
import {
  ITaskRepository,
  taskRepository,
} from "../repository/taskRepository";
import { TaskReassignment } from "../entities/Task";
import { ValidationError } from "@/shared/errors/domainErrors";

export async function getReassignmentHistoryUseCase(
  context: RequestContext,
  taskId: string,
  repo: ITaskRepository = taskRepository
): Promise<TaskReassignment[]> {
  if (!taskId) {
    throw new ValidationError("Task ID is required.");
  }

  return repo.getReassignmentHistory(taskId, context.orgId);
}

import { RequestContext } from "@/shared/types/context";
import { Comment } from "../entities/Comment";
import { ICommentRepository, commentRepository } from "../repository/commentRepository";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { NotFoundError } from "@/shared/errors/domainErrors";

export async function listCommentsUseCase(
  context: RequestContext,
  taskId: string,
  repo: ICommentRepository = commentRepository,
  taskRepo: ITaskRepository = taskRepository
): Promise<Comment[]> {
  const task = await taskRepo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new NotFoundError("Task not found in your organization.");
  }

  return await repo.listComments(taskId);
}

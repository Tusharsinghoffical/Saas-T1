import { RequestContext } from "@/shared/types/context";
import { Comment, CreateCommentDTO } from "../entities/Comment";
import { ICommentRepository, commentRepository } from "../repository/commentRepository";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { recordActivityLogUseCase } from "@/domains/activity";
import { NotFoundError } from "@/shared/errors/domainErrors";

export async function addCommentUseCase(
  context: RequestContext,
  taskId: string,
  data: CreateCommentDTO,
  repo: ICommentRepository = commentRepository,
  taskRepo: ITaskRepository = taskRepository
): Promise<Comment> {
  const task = await taskRepo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new NotFoundError("Task not found in your organization.");
  }

  const comment = await repo.addComment(taskId, context.userId, data);

  // Record Activity Log (non-blocking)
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "comment.created",
    entity: "task_comments",
    entityId: comment.id,
    diff: { task_id: taskId, body: data.content },
  }).catch(() => {});

  return comment;
}

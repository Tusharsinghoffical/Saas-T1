import { RequestContext } from "@/shared/types/context";
import { Comment, CreateCommentDTO } from "../entities/Comment";
import { ICommentRepository, commentRepository } from "../repository/commentRepository";
import { recordActivityLogUseCase } from "@/domains/activity";

export async function addCommentUseCase(
  context: RequestContext,
  taskId: string,
  data: CreateCommentDTO,
  repo: ICommentRepository = commentRepository
): Promise<Comment> {
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

import { RequestContext } from "@/shared/types/context";
import { Comment } from "../entities/Comment";
import { ICommentRepository, commentRepository } from "../repository/commentRepository";

export async function listCommentsUseCase(
  context: RequestContext,
  taskId: string,
  repo: ICommentRepository = commentRepository
): Promise<Comment[]> {
  return await repo.listComments(taskId);
}

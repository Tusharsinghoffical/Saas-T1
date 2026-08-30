import { requireAuth } from "@/shared/middleware/rbacGuard";
import { createCommentSchema } from "@/lib/validators/comment";
import { listCommentsUseCase } from "../usecases/listComments";
import { addCommentUseCase } from "../usecases/addComment";
import { ValidationError } from "@/shared/errors/domainErrors";

export class CommentController {
  async listComments(taskId: string) {
    const auth = await requireAuth();
    return await listCommentsUseCase(auth, taskId);
  }

  async addComment(taskId: string, body: any) {
    const auth = await requireAuth();

    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues[0]?.message || "Comment cannot be empty"
      );
    }

    return await addCommentUseCase(auth, taskId, validation.data);
  }
}

export const commentController = new CommentController();

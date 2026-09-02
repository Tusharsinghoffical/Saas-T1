import { requireAuth } from "@/shared/middleware/rbacGuard";
import {
  presignedUrlRequestSchema,
  createAttachmentSchema,
} from "@/lib/validators/attachment";
import { listAttachmentsUseCase } from "../usecases/listAttachments";
import { getPresignedUploadUrlUseCase } from "../usecases/getPresignedUploadUrl";
import { saveAttachmentUseCase } from "../usecases/saveAttachment";
import { attachmentRepository } from "../repository/attachmentRepository";
import { taskRepository } from "../repository/taskRepository";
import { ValidationError, NotFoundError } from "@/shared/errors/domainErrors";

export class AttachmentController {
  async listAttachments(taskId: string) {
    const auth = await requireAuth();
    return await listAttachmentsUseCase(auth, taskId);
  }

  async handleAttachmentAction(taskId: string, body: any) {
    const auth = await requireAuth();
    const action = body?.action || (body?.fileUrl ? "save_attachment" : "get_presigned_url");

    if (action === "get_presigned_url") {
      const validation = presignedUrlRequestSchema.safeParse(body);
      if (!validation.success) {
        throw new ValidationError("Validation failed", validation.error.flatten().fieldErrors);
      }
      return await getPresignedUploadUrlUseCase(auth, taskId, validation.data);
    }

    if (action === "save_attachment" || action === "add_link" || action === "save_link") {
      const validation = createAttachmentSchema.safeParse(body);
      if (!validation.success) {
        throw new ValidationError("Validation failed", validation.error.flatten().fieldErrors);
      }
      return await saveAttachmentUseCase(auth, taskId, validation.data);
    }

    if (action === "delete_attachment" && body?.attachmentId) {
      const task = await taskRepository.getTaskById(taskId, auth.orgId);
      if (!task) {
        throw new NotFoundError("Task not found in your organization.");
      }
      const success = await attachmentRepository.deleteAttachment?.(body.attachmentId, taskId);
      return { success };
    }

    throw new ValidationError("Invalid attachment action specified.");
  }
}

export const attachmentController = new AttachmentController();

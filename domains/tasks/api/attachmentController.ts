import { requireAuth } from "@/shared/middleware/rbacGuard";
import {
  presignedUrlRequestSchema,
  createAttachmentSchema,
} from "@/lib/validators/attachment";
import { listAttachmentsUseCase } from "../usecases/listAttachments";
import { getPresignedUploadUrlUseCase } from "../usecases/getPresignedUploadUrl";
import { saveAttachmentUseCase } from "../usecases/saveAttachment";
import { ValidationError } from "@/shared/errors/domainErrors";

export class AttachmentController {
  async listAttachments(taskId: string) {
    const auth = await requireAuth();
    return await listAttachmentsUseCase(auth, taskId);
  }

  async handleAttachmentAction(taskId: string, body: any) {
    const auth = await requireAuth();
    const action = body?.action || "get_presigned_url";

    if (action === "get_presigned_url") {
      const validation = presignedUrlRequestSchema.safeParse(body);
      if (!validation.success) {
        throw new ValidationError("Validation failed", validation.error.flatten().fieldErrors);
      }
      return await getPresignedUploadUrlUseCase(auth, taskId, validation.data);
    }

    if (action === "save_attachment") {
      const validation = createAttachmentSchema.safeParse(body);
      if (!validation.success) {
        throw new ValidationError("Validation failed", validation.error.flatten().fieldErrors);
      }
      return await saveAttachmentUseCase(auth, taskId, validation.data);
    }

    throw new ValidationError("Invalid attachment action specified.");
  }
}

export const attachmentController = new AttachmentController();

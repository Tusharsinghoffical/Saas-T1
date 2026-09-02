import { RequestContext } from "@/shared/types/context";
import { Attachment, CreateAttachmentDTO } from "../entities/Attachment";
import { IAttachmentRepository, attachmentRepository } from "../repository/attachmentRepository";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { recordActivityLogUseCase } from "@/domains/activity";
import { ValidationError, NotFoundError } from "@/shared/errors/domainErrors";

export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25MB default chosen, confirm or change

export async function saveAttachmentUseCase(
  context: RequestContext,
  taskId: string,
  data: CreateAttachmentDTO,
  repo: IAttachmentRepository = attachmentRepository,
  taskRepo: ITaskRepository = taskRepository
): Promise<Attachment> {
  if (data.fileSize === undefined || data.fileSize === null || data.fileSize <= 0) {
    throw new ValidationError("File size must be greater than 0 bytes.");
  }

  if (data.fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new ValidationError("File size exceeds the 25MB limit.");
  }

  const task = await taskRepo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new NotFoundError("Task not found in your organization.");
  }

  const attachment = await repo.saveAttachment(taskId, context.userId, data);

  // Record Activity Log
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "attachment.uploaded",
    entity: "task_attachments",
    entityId: attachment.id,
    diff: { task_id: taskId, file_name: data.fileName, file_size: data.fileSize },
  });

  return attachment;
}

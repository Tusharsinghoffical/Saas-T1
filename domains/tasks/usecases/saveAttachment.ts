import { RequestContext } from "@/shared/types/context";
import { Attachment, CreateAttachmentDTO } from "../entities/Attachment";
import {
  IAttachmentRepository,
  attachmentRepository,
} from "../repository/attachmentRepository";
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
  // Reject negative file sizes
  if (data.fileSize !== undefined && data.fileSize !== null && data.fileSize < 0) {
    throw new ValidationError("File size cannot be negative.");
  }

  // Links (external resource URLs) have fileSize: 0 or fileType: "link"
  const isLink = data.fileType === "link" || data.fileSize === 0;

  if (!isLink) {
    if (
      data.fileSize === undefined ||
      data.fileSize === null ||
      data.fileSize <= 0
    ) {
      throw new ValidationError("File size must be greater than 0 bytes.");
    }
  }

  if (data.fileSize && data.fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new ValidationError("File size exceeds the 25MB limit.");
  }

  const task = await taskRepo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new NotFoundError("Task not found in your organization.");
  }

  const attachment = await repo.saveAttachment(taskId, context.userId, data);

  // Update task's updated_at timestamp so tasks table realtime subscribers refresh!
  try {
    const { createAdminClient } = await import(
      "@/infrastructure/supabase/supabaseServer"
    );
    const adminClient = createAdminClient();
    await (adminClient.from("tasks") as any)
      .update({ updated_at: new Date().toISOString() })
      .eq("id", taskId);
  } catch {}

  // Record Activity Log with rich details
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "attachment.uploaded",
    entity: "task_attachments",
    entityId: attachment.id,
    diff: {
      task_id: taskId,
      task_title: task.title,
      file_name: data.fileName,
      file_url: data.fileUrl,
      file_size: data.fileSize || 0,
      file_type: data.fileType || "link",
    },
  });

  return attachment;
}

import { RequestContext } from "@/shared/types/context";
import { Attachment, CreateAttachmentDTO } from "../entities/Attachment";
import { IAttachmentRepository, attachmentRepository } from "../repository/attachmentRepository";
import { recordActivityLogUseCase } from "@/domains/activity";

export async function saveAttachmentUseCase(
  context: RequestContext,
  taskId: string,
  data: CreateAttachmentDTO,
  repo: IAttachmentRepository = attachmentRepository
): Promise<Attachment> {
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

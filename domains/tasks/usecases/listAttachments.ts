import { RequestContext } from "@/shared/types/context";
import { Attachment } from "../entities/Attachment";
import { IAttachmentRepository, attachmentRepository } from "../repository/attachmentRepository";

export async function listAttachmentsUseCase(
  context: RequestContext,
  taskId: string,
  repo: IAttachmentRepository = attachmentRepository
): Promise<Attachment[]> {
  return await repo.listAttachments(taskId);
}

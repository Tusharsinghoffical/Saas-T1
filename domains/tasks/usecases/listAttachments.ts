import { RequestContext } from "@/shared/types/context";
import { Attachment } from "../entities/Attachment";
import { IAttachmentRepository, attachmentRepository } from "../repository/attachmentRepository";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { NotFoundError } from "@/shared/errors/domainErrors";

export async function listAttachmentsUseCase(
  context: RequestContext,
  taskId: string,
  repo: IAttachmentRepository = attachmentRepository,
  taskRepo: ITaskRepository = taskRepository
): Promise<Attachment[]> {
  const task = await taskRepo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new NotFoundError("Task not found in your organization.");
  }

  return await repo.listAttachments(taskId);
}

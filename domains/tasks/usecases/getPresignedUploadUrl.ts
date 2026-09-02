import { RequestContext } from "@/shared/types/context";
import { PresignedUrlRequestDTO } from "../entities/Attachment";
import { getR2PresignedPutUrl, MAX_FILE_SIZE_BYTES } from "@/infrastructure/storage/r2Storage";
import { ValidationError, NotFoundError } from "@/shared/errors/domainErrors";
import { taskRepository, ITaskRepository } from "../repository/taskRepository";

/**
 * Generates a Cloudflare R2 presigned PUT URL for task file attachments.
 *
 * SECURITY FIXES (FAIL 7.5):
 * 1. Tenant ownership check: taskId MUST belong to context.orgId before any
 *    presigned URL is issued. Cross-tenant task ID abuse returns 404.
 * 2. Tenant-namespaced R2 key: `${orgId}/${taskId}/...` enforces tenant
 *    boundary in object storage itself, not just in the database reference.
 *
 * DDS layer: Domain UseCase — business-rule enforcement before I/O.
 */
export async function getPresignedUploadUrlUseCase(
  context: RequestContext,
  taskId: string,
  data: PresignedUrlRequestDTO,
  repo: ITaskRepository = taskRepository
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  // ── SECURITY FIX (a): Verify task belongs to the requesting tenant ──────
  // An attacker from Org A cannot pass Org B's taskId to get a presigned URL
  // that writes into Org B's namespace.
  const task = await repo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new NotFoundError("Task not found in your organization.");
  }

  if (data.fileSize === undefined || data.fileSize === null || data.fileSize <= 0) {
    throw new ValidationError("File size must be greater than 0 bytes.");
  }

  if (data.fileSize > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError("File exceeds 25MB limit.");
  }

  // Sanitize filename: only safe chars allowed in object key
  const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  // ── SECURITY FIX (b): Tenant-namespaced R2 key ──────────────────────────
  // Old: `tasks/${taskId}/${Date.now()}-${safeName}`     ← no tenant boundary
  // New: `${orgId}/${taskId}/${Date.now()}-${safeName}`  ← tenant isolated
  const key = `${context.orgId}/${taskId}/${Date.now()}-${safeName}`;

  const { uploadUrl, fileUrl } = await getR2PresignedPutUrl({
    bucket: process.env.CLOUDFLARE_R2_BUCKET || "tasq-attachments",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || "",
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
    key,
    contentType: data.fileType,
    expiresInSeconds: 180, // 3-minute short-lived URL (default chosen, confirm or change)
  });

  return { uploadUrl, fileUrl, key };
}

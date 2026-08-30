import { z } from "zod";

export const presignedUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024, "File size must not exceed 10MB"),
});

export const createAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url("Invalid file URL"),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024, "File size must not exceed 10MB"),
  fileType: z.string().optional().default("application/octet-stream"),
});

export type PresignedUrlRequestInput = z.infer<typeof presignedUrlRequestSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

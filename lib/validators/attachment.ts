import { z } from "zod";

export const presignedUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100).optional().default("application/octet-stream"),
  fileSize: z.number().int().min(0).max(100 * 1024 * 1024).optional().default(0),
});

export const createAttachmentSchema = z.object({
  fileName: z.string().min(1, "Link/File title is required").max(255),
  fileUrl: z.string().url("Please enter a valid URL starting with http:// or https://"),
  fileSize: z.number().int().min(0).max(100 * 1024 * 1024).optional().default(0),
  fileType: z.string().optional().default("link"),
});

export type PresignedUrlRequestInput = z.infer<typeof presignedUrlRequestSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

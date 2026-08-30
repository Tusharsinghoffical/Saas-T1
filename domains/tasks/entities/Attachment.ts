/**
 * Pure Domain Entity: Attachment
 * ZERO framework or database imports.
 */

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string | null;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy?: string | null;
  createdAt: string;
}

export interface PresignedUrlRequestDTO {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface CreateAttachmentDTO {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType?: string;
}

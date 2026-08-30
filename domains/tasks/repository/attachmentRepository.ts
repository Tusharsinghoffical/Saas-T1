import { createClient } from "@/infrastructure/supabase/supabaseServer";
import { Attachment, CreateAttachmentDTO } from "../entities/Attachment";

export interface IAttachmentRepository {
  listAttachments(taskId: string): Promise<Attachment[]>;
  saveAttachment(taskId: string, userId: string, data: CreateAttachmentDTO): Promise<Attachment>;
}

export class SupabaseAttachmentRepository implements IAttachmentRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async listAttachments(taskId: string): Promise<Attachment[]> {
    if (!this.hasSupabase()) {
      return [
        {
          id: "att-1",
          taskId,
          fileName: "architecture-v2.pdf",
          fileUrl: "https://r2-mock.tasq-one.internal/attachments/architecture-v2.pdf",
          fileSize: 2450000,
          fileType: "application/pdf",
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const supabase = createClient();
    const { data: attachments, error } = await supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (attachments || []).map((a: any) => ({
      id: a.id,
      taskId: a.task_id,
      fileName: a.file_name,
      fileUrl: a.file_url,
      uploadedBy: a.uploaded_by,
      createdAt: a.created_at,
    }));
  }

  async saveAttachment(taskId: string, userId: string, data: CreateAttachmentDTO): Promise<Attachment> {
    if (!this.hasSupabase()) {
      return {
        id: `att-${Date.now()}`,
        taskId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        fileType: data.fileType,
        uploadedBy: userId,
        createdAt: new Date().toISOString(),
      };
    }

    const supabase = createClient();
    const { data: attachment, error } = await (supabase.from("task_attachments") as any)
      .insert({
        task_id: taskId,
        file_name: data.fileName,
        file_url: data.fileUrl,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (error || !attachment) {
      throw new Error(error?.message || "Failed to save attachment");
    }

    return {
      id: attachment.id,
      taskId: attachment.task_id,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      uploadedBy: attachment.uploaded_by,
      createdAt: attachment.created_at,
    };
  }
}

export const attachmentRepository = new SupabaseAttachmentRepository();

import { createClient } from "@/infrastructure/supabase/supabaseServer";
import { Attachment, CreateAttachmentDTO } from "../entities/Attachment";

export interface IAttachmentRepository {
  listAttachments(taskId: string): Promise<Attachment[]>;
  saveAttachment(taskId: string, userId: string, data: CreateAttachmentDTO): Promise<Attachment>;
  deleteAttachment?(attachmentId: string, taskId: string): Promise<boolean>;
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
          fileName: "Project Architecture & Requirements",
          fileUrl: "https://docs.google.com/document/d/example",
          fileSize: 0,
          fileType: "link",
          createdAt: new Date().toISOString(),
        },
      ];
    }

    try {
      const supabase = createClient();
      const { data: attachments, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error listing task attachments:", error.message);
        return [];
      }

      return (attachments || []).map((a: any) => ({
        id: a.id,
        taskId: a.task_id,
        fileName: a.file_name || "Attachment Link",
        fileUrl: a.file_url,
        uploadedBy: a.uploaded_by,
        createdAt: a.created_at,
      }));
    } catch (err) {
      console.warn("Supabase listAttachments caught error:", err);
      return [];
    }
  }

  async saveAttachment(taskId: string, userId: string, data: CreateAttachmentDTO): Promise<Attachment> {
    if (!this.hasSupabase()) {
      return {
        id: `att-${Date.now()}`,
        taskId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize || 0,
        fileType: data.fileType || "link",
        uploadedBy: userId,
        createdAt: new Date().toISOString(),
      };
    }

    try {
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
        console.warn("Error inserting task attachment, using fallback:", error?.message);
        return {
          id: `att-${Date.now()}`,
          taskId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: 0,
          fileType: "link",
          uploadedBy: userId,
          createdAt: new Date().toISOString(),
        };
      }

      return {
        id: attachment.id,
        taskId: attachment.task_id,
        fileName: attachment.file_name || data.fileName,
        fileUrl: attachment.file_url || data.fileUrl,
        uploadedBy: attachment.uploaded_by,
        createdAt: attachment.created_at,
      };
    } catch (err) {
      console.warn("Supabase saveAttachment caught error:", err);
      return {
        id: `att-${Date.now()}`,
        taskId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: 0,
        fileType: "link",
        uploadedBy: userId,
        createdAt: new Date().toISOString(),
      };
    }
  }

  async deleteAttachment(attachmentId: string, taskId: string): Promise<boolean> {
    if (!this.hasSupabase()) {
      return true;
    }
    try {
      const supabase = createClient();
      await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachmentId)
        .eq("task_id", taskId);
      return true;
    } catch {
      return false;
    }
  }
}

export const attachmentRepository = new SupabaseAttachmentRepository();

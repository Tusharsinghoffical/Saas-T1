import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { Attachment, CreateAttachmentDTO } from "../entities/Attachment";

export interface IAttachmentRepository {
  listAttachments(taskId: string): Promise<Attachment[]>;
  saveAttachment(taskId: string, userId: string, data: CreateAttachmentDTO): Promise<Attachment>;
  deleteAttachment(attachmentId: string, taskId: string): Promise<boolean>;
}

export class SupabaseAttachmentRepository implements IAttachmentRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  private getClient() {
    try {
      const adminClient = createAdminClient();
      return adminClient || createClient();
    } catch {
      return createClient();
    }
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
      const client = this.getClient();
      const { data: attachments, error } = await (client.from("task_attachments") as any)
        .select("id, task_id, file_name, file_url, uploaded_by, created_at")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[listAttachments Error]", error.message);
        return [];
      }

      return (attachments || []).map((a: any) => ({
        id: a.id,
        taskId: a.task_id,
        fileName: a.file_name || "Attachment Link",
        fileUrl: a.file_url,
        fileSize: 0,
        fileType: "link",
        uploadedBy: a.uploaded_by,
        createdAt: a.created_at,
      }));
    } catch (err) {
      console.error("[listAttachments Exception]", err);
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
      const client = this.getClient();
      const { data: attachment, error } = await (client.from("task_attachments") as any)
        .insert({
          task_id: taskId,
          file_name: data.fileName,
          file_url: data.fileUrl,
          uploaded_by: userId,
        })
        .select("id, task_id, file_name, file_url, uploaded_by, created_at")
        .single();

      if (error || !attachment) {
        console.error("[saveAttachment DB Error]", error?.message);
        throw new Error(error?.message || "Failed to save attachment link in database");
      }

      return {
        id: attachment.id,
        taskId: attachment.task_id,
        fileName: attachment.file_name || data.fileName,
        fileUrl: attachment.file_url || data.fileUrl,
        fileSize: 0,
        fileType: "link",
        uploadedBy: attachment.uploaded_by,
        createdAt: attachment.created_at,
      };
    } catch (err: any) {
      console.error("[saveAttachment Exception]", err);
      throw new Error(err.message || "Failed to save attachment");
    }
  }

  async deleteAttachment(attachmentId: string, taskId: string): Promise<boolean> {
    if (!this.hasSupabase()) {
      return true;
    }
    try {
      const client = this.getClient();
      const { error } = await (client.from("task_attachments") as any)
        .delete()
        .eq("id", attachmentId)
        .eq("task_id", taskId);

      if (error) {
        console.error("[deleteAttachment Error]", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[deleteAttachment Exception]", err);
      return false;
    }
  }
}

export const attachmentRepository = new SupabaseAttachmentRepository();

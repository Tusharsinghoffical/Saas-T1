import { createClient } from "@/infrastructure/supabase/supabaseServer";
import { Comment, CreateCommentDTO } from "../entities/Comment";

export interface ICommentRepository {
  listComments(taskId: string): Promise<Comment[]>;
  addComment(taskId: string, userId: string, data: CreateCommentDTO): Promise<Comment>;
}

export class SupabaseCommentRepository implements ICommentRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async listComments(taskId: string): Promise<Comment[]> {
    if (!this.hasSupabase()) {
      return [
        {
          id: "com-1",
          taskId,
          content: "Hey @Jane Doe, please review the latest designs.",
          author: { id: "22222222-2222-2222-2222-222222222222", fullName: "Alex Smith", avatarUrl: null },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "com-2",
          taskId,
          content: "Looks great! We will proceed with implementation.",
          author: { id: "mem-1", fullName: "Jane Doe", avatarUrl: null },
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ];
    }

    const supabase = createClient();
    const { data: comments, error } = await supabase
      .from("task_comments")
      .select(`
        id,
        task_id,
        body,
        created_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (comments || []).map((c: any) => ({
      id: c.id,
      taskId: c.task_id,
      content: c.body,
      createdAt: c.created_at,
      author: c.profiles || { id: "unknown", fullName: "Anonymous" },
    }));
  }

  async addComment(taskId: string, userId: string, data: CreateCommentDTO): Promise<Comment> {
    if (!this.hasSupabase()) {
      return {
        id: `com-${Date.now()}`,
        taskId,
        content: data.content,
        author: { id: userId, fullName: "Current User", avatarUrl: null },
        createdAt: new Date().toISOString(),
      };
    }

    const supabase = createClient();
    const { data: comment, error } = await (supabase.from("task_comments") as any)
      .insert({
        task_id: taskId,
        user_id: userId,
        body: data.content,
      })
      .select(`
        id,
        task_id,
        body,
        created_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error || !comment) {
      throw new Error(error?.message || "Failed to create comment");
    }

    return {
      id: comment.id,
      taskId: comment.task_id,
      content: comment.body,
      createdAt: comment.created_at,
      author: (comment as any).profiles || { id: userId, fullName: "User" },
    };
  }
}

export const commentRepository = new SupabaseCommentRepository();

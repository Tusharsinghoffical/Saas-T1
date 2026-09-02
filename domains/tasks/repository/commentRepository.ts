import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
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

  private getClient() {
    try {
      return createClient();
    } catch {
      return createAdminClient();
    }
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

    try {
      const client = this.getClient();
      const { data: rawComments, error } = await (client.from("task_comments") as any)
        .select("id, task_id, user_id, body, created_at")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[listComments Error]", error.message);
        return [];
      }

      const commentsList = rawComments || [];
      const userIds: string[] = Array.from(
        new Set(commentsList.map((c: any) => c.user_id).filter(Boolean))
      );

      const profileMap = new Map<string, { id: string; fullName: string; full_name: string; avatarUrl: string | null }>();

      if (userIds.length > 0) {
        try {
          const { data: profiles } = await (client.from("profiles") as any)
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          if (profiles && Array.isArray(profiles)) {
            for (const p of profiles) {
              profileMap.set(p.id, {
                id: p.id,
                fullName: p.full_name || "Team Member",
                full_name: p.full_name || "Team Member",
                avatarUrl: p.avatar_url || null,
              });
            }
          }
        } catch {
          // Fallback
        }
      }

      return commentsList.map((c: any) => {
        const authorProfile = profileMap.get(c.user_id) || {
          id: c.user_id || "unknown",
          fullName: "Team Member",
          full_name: "Team Member",
          avatarUrl: null,
        };

        return {
          id: c.id,
          taskId: c.task_id,
          task_id: c.task_id,
          content: c.body,
          body: c.body,
          createdAt: c.created_at,
          created_at: c.created_at,
          author: authorProfile,
          profiles: authorProfile,
        } as any;
      });
    } catch (err) {
      console.error("[listComments Exception]", err);
      return [];
    }
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

    try {
      const client = this.getClient();
      const { data: comment, error } = await (client.from("task_comments") as any)
        .insert({
          task_id: taskId,
          user_id: userId,
          body: data.content,
        })
        .select("id, task_id, user_id, body, created_at")
        .single();

      if (error || !comment) {
        console.error("[addComment Insert Error]", error?.message);
        throw new Error(error?.message || "Failed to create comment in database");
      }

      // Fetch author profile
      let authorName = "Team Member";
      let avatarUrl: string | null = null;

      try {
        const { data: profile } = await (client.from("profiles") as any)
          .select("id, full_name, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (profile) {
          authorName = profile.full_name || "Team Member";
          avatarUrl = profile.avatar_url || null;
        }
      } catch {
        // Fallback
      }

      const authorObj = {
        id: userId,
        fullName: authorName,
        full_name: authorName,
        avatarUrl,
        avatar_url: avatarUrl,
      };

      return {
        id: comment.id,
        taskId: comment.task_id,
        task_id: comment.task_id,
        content: comment.body,
        body: comment.body,
        createdAt: comment.created_at,
        created_at: comment.created_at,
        author: authorObj,
        profiles: authorObj,
      } as any;
    } catch (err: any) {
      console.error("[addComment Exception]", err);
      throw new Error(err.message || "Failed to save comment");
    }
  }
}

export const commentRepository = new SupabaseCommentRepository();

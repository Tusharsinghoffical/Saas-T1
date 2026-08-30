import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { ActivityLog, ActivityLogInput, ActivityFilterDTO } from "../entities/ActivityLog";

export interface IActivityRepository {
  recordLog(input: ActivityLogInput): Promise<boolean>;
  listLogs(orgId: string, filters: ActivityFilterDTO): Promise<{ logs: ActivityLog[]; total: number }>;
  getAllLogsForCsv(orgId: string, entity?: string | null, action?: string | null): Promise<ActivityLog[]>;
}

export class SupabaseActivityRepository implements IActivityRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async recordLog(input: ActivityLogInput): Promise<boolean> {
    if (!this.hasSupabase()) {
      console.log(
        `[Audit Log Mock] Org: ${input.orgId} | Actor: ${input.actorId} | Action: ${input.action} | Entity: ${input.entity}#${input.entityId}`
      );
      return true;
    }

    try {
      const adminClient = createAdminClient();
      const { error } = await (adminClient.from("activity_logs") as any).insert({
        org_id: input.orgId,
        actor_id: input.actorId || null,
        action: input.action,
        entity: input.entity,
        entity_id: input.entityId || null,
        diff: input.diff || null,
      });

      if (error) {
        console.error("[Audit Log Error]", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[Audit Log Error]", err);
      return false;
    }
  }

  async listLogs(orgId: string, filters: ActivityFilterDTO): Promise<{ logs: ActivityLog[]; total: number }> {
    if (!this.hasSupabase()) {
      const mockLogs: ActivityLog[] = [
        {
          id: "log-1",
          orgId,
          actor: { id: "user-1", fullName: "Jane Doe (Admin)", avatarUrl: null },
          action: "task.created",
          entity: "tasks",
          entityId: "task-1",
          diff: { title: "Set up company workspace", priority: "high", status: "in_progress" },
          createdAt: new Date(Date.now() - 60000 * 12).toISOString(),
        },
        {
          id: "log-2",
          orgId,
          actor: { id: "user-2", fullName: "Alex Smith", avatarUrl: null },
          action: "task.updated",
          entity: "tasks",
          entityId: "task-2",
          diff: { status: "in_progress" },
          createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        },
        {
          id: "log-3",
          orgId,
          actor: { id: "user-3", fullName: "Rohan Patel", avatarUrl: null },
          action: "comment.created",
          entity: "task_comments",
          entityId: "com-3",
          diff: { task_id: "task-3", body: "Configured Upstash Redis client with 60s TTL." },
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: "log-4",
          orgId,
          actor: { id: "user-1", fullName: "Jane Doe (Admin)", avatarUrl: null },
          action: "attachment.uploaded",
          entity: "task_attachments",
          entityId: "att-4",
          diff: { file_name: "architecture_diagram.pdf", file_size: 1048576 },
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
      ];

      return { logs: mockLogs, total: mockLogs.length };
    }

    const supabase = createClient();
    let query = (supabase.from("activity_logs") as any)
      .select(`
        id,
        org_id,
        action,
        entity,
        entity_id,
        diff,
        created_at,
        actor:actor_id (
          id,
          full_name,
          avatar_url
        )
      `, { count: "exact" })
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (filters.entity) query = query.eq("entity", filters.entity);
    if (filters.action) query = query.eq("action", filters.action);

    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    const { data: rawLogs, count, error } = await query.range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const logs: ActivityLog[] = (rawLogs || []).map((l: any) => ({
      id: l.id,
      orgId: l.org_id,
      action: l.action,
      entity: l.entity,
      entityId: l.entity_id,
      diff: l.diff,
      createdAt: l.created_at,
      actor: l.actor ? { id: l.actor.id, fullName: l.actor.full_name, avatarUrl: l.actor.avatar_url } : undefined,
    }));

    return { logs, total: count || 0 };
  }

  async getAllLogsForCsv(orgId: string, entity?: string | null, action?: string | null): Promise<ActivityLog[]> {
    if (!this.hasSupabase()) {
      const { logs } = await this.listLogs(orgId, { page: 1, limit: 1000 });
      return logs;
    }

    const supabase = createClient();
    let query = (supabase.from("activity_logs") as any)
      .select(`
        id,
        org_id,
        action,
        entity,
        entity_id,
        diff,
        created_at,
        actor:actor_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (entity) query = query.eq("entity", entity);
    if (action) query = query.eq("action", action);

    const { data: rawLogs, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return (rawLogs || []).map((l: any) => ({
      id: l.id,
      orgId: l.org_id,
      action: l.action,
      entity: l.entity,
      entityId: l.entity_id,
      diff: l.diff,
      createdAt: l.created_at,
      actor: l.actor ? { id: l.actor.id, fullName: l.actor.full_name, avatarUrl: l.actor.avatar_url } : undefined,
    }));
  }
}

export const activityRepository = new SupabaseActivityRepository();

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

  private getClient() {
    const adminClient = createAdminClient();
    return adminClient || createClient();
  }

  async recordLog(input: ActivityLogInput): Promise<boolean> {
    if (!this.hasSupabase()) {
      console.log(
        `[Audit Log Mock] Org: ${input.orgId} | Actor: ${input.actorId} | Action: ${input.action} | Entity: ${input.entity}#${input.entityId}`
      );
      return true;
    }

    try {
      if (!input.orgId) return false;

      // UUID format validation for PostgreSQL UUID columns
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidOrgUuid = uuidRegex.test(input.orgId);
      if (!isValidOrgUuid) {
        return false;
      }

      const client = this.getClient();
      const isEntityUuid = input.entityId ? uuidRegex.test(input.entityId) : false;
      const isActorUuid = input.actorId ? uuidRegex.test(input.actorId) : false;

      const payload: Record<string, any> = {
        org_id: input.orgId,
        actor_id: isActorUuid ? input.actorId : null,
        action: input.action,
        entity: input.entity,
        entity_id: isEntityUuid ? input.entityId : null,
        diff: input.diff || null,
      };

      const { error } = await (client.from("activity_logs") as any).insert(payload);

      if (error) {
        console.error("[Audit Log Insert Error]", error.message);
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

    try {
      const client = this.getClient();

      // Query raw activity_logs directly without fragile schema join
      let query = (client.from("activity_logs") as any)
        .select("id, org_id, actor_id, action, entity, entity_id, diff, created_at", { count: "exact" })
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (filters.entity) query = query.eq("entity", filters.entity);
      if (filters.action) query = query.eq("action", filters.action);

      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      const { data: rawLogs, count, error } = await query.range(from, to);

      if (error) {
        console.error("[listLogs Error]", error.message);
        return { logs: [], total: 0 };
      }

      const logsList = rawLogs || [];

      // Collect unique actor IDs to batch hydrate profiles
      const actorIds: string[] = Array.from(
        new Set(logsList.map((l: any) => l.actor_id).filter(Boolean))
      );

      const profileMap = new Map<string, { id: string; fullName: string; avatarUrl: string | null }>();

      if (actorIds.length > 0) {
        try {
          const { data: profiles } = await (client.from("profiles") as any)
            .select("id, full_name, avatar_url")
            .in("id", actorIds);

          if (profiles && Array.isArray(profiles)) {
            for (const p of profiles) {
              profileMap.set(p.id, {
                id: p.id,
                fullName: p.full_name || "Team Member",
                avatarUrl: p.avatar_url || null,
              });
            }
          }
        } catch {
          // Non-blocking fallback for profiles lookup
        }
      }

      const logs: ActivityLog[] = logsList.map((l: any) => ({
        id: l.id,
        orgId: l.org_id,
        actorId: l.actor_id,
        action: l.action,
        entity: l.entity,
        entityId: l.entity_id,
        diff: l.diff,
        createdAt: l.created_at,
        actor: l.actor_id
          ? profileMap.get(l.actor_id) || { id: l.actor_id, fullName: "Team Member", avatarUrl: null }
          : { id: "system", fullName: "System", avatarUrl: null },
      }));

      return { logs, total: count || 0 };
    } catch (err: any) {
      console.error("[listLogs Exception]", err);
      return { logs: [], total: 0 };
    }
  }

  async getAllLogsForCsv(orgId: string, entity?: string | null, action?: string | null): Promise<ActivityLog[]> {
    if (!this.hasSupabase()) {
      const { logs } = await this.listLogs(orgId, { page: 1, limit: 1000 });
      return logs;
    }

    try {
      const client = this.getClient();
      let query = (client.from("activity_logs") as any)
        .select("id, org_id, actor_id, action, entity, entity_id, diff, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (entity) query = query.eq("entity", entity);
      if (action) query = query.eq("action", action);

      const { data: rawLogs, error } = await query;
      if (error) {
        console.error("[getAllLogsForCsv Error]", error.message);
        return [];
      }

      const logsList = rawLogs || [];
      const actorIds: string[] = Array.from(
        new Set(logsList.map((l: any) => l.actor_id).filter(Boolean))
      );

      const profileMap = new Map<string, { id: string; fullName: string; avatarUrl: string | null }>();

      if (actorIds.length > 0) {
        try {
          const { data: profiles } = await (client.from("profiles") as any)
            .select("id, full_name, avatar_url")
            .in("id", actorIds);

          if (profiles && Array.isArray(profiles)) {
            for (const p of profiles) {
              profileMap.set(p.id, {
                id: p.id,
                fullName: p.full_name || "Team Member",
                avatarUrl: p.avatar_url || null,
              });
            }
          }
        } catch {
          // Non-blocking fallback
        }
      }

      return logsList.map((l: any) => ({
        id: l.id,
        orgId: l.org_id,
        actorId: l.actor_id,
        action: l.action,
        entity: l.entity,
        entityId: l.entity_id,
        diff: l.diff,
        createdAt: l.created_at,
        actor: l.actor_id
          ? profileMap.get(l.actor_id) || { id: l.actor_id, fullName: "Team Member", avatarUrl: null }
          : { id: "system", fullName: "System", avatarUrl: null },
      }));
    } catch (err: any) {
      console.error("[getAllLogsForCsv Exception]", err);
      return [];
    }
  }
}

export const activityRepository = new SupabaseActivityRepository();

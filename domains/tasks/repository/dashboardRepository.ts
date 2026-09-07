import {
  createClient,
  createAdminClient,
} from "@/infrastructure/supabase/supabaseServer";

export interface IDashboardRepository {
  getAdminDashboardTasks(orgId: string, teamId?: string | null): Promise<any[]>;
  getManagerDashboardTasks(
    orgId: string,
    managerUserId: string,
    teamId?: string | null
  ): Promise<any[]>;
  getEmployeeTasks(orgId: string, userId: string): Promise<any[]>;
  getStatusCounts(
    orgId: string,
    teamId?: string | null
  ): Promise<Record<string, number>>;
}

export class SupabaseDashboardRepository implements IDashboardRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  private getClient() {
    return createClient();
  }

  async getAdminDashboardTasks(
    orgId: string,
    teamId?: string | null
  ): Promise<any[]> {
    if (!this.hasSupabase()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Supabase configuration missing in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return [];
    }

    const client = this.getClient();
    let query = (client.from("tasks") as any)
      .select(
        "id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data: rawTasks, error } = await query;
    if (error) {
      console.warn("[getAdminDashboardTasks notice]", error.message);
      try {
        const adminClient = createAdminClient();
        const { data: adminTasks } = await (adminClient.from("tasks") as any)
          .select(
            "id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });
        if (adminTasks && adminTasks.length > 0) {
          return adminTasks;
        }
      } catch {}
      return [];
    }

    // Auto-seed sample workspace tasks only in non-production environments
    if (
      process.env.NODE_ENV !== "production" &&
      (!rawTasks || rawTasks.length === 0) &&
      !teamId
    ) {
      try {
        const { seedWorkspaceDataUseCase } =
          await import("../usecases/seedWorkspaceData");
        const seedResult = await seedWorkspaceDataUseCase(orgId);
        if (seedResult.success && seedResult.tasksCount > 0) {
          const { data: seeded } = await (client.from("tasks") as any)
            .select(
              "id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by"
            )
            .eq("org_id", orgId)
            .order("created_at", { ascending: false });
          if (seeded && seeded.length > 0) return seeded;
        }
      } catch (seedErr) {
        console.warn("[getAdminDashboardTasks auto-seed notice]", seedErr);
      }
    }

    if (!rawTasks || rawTasks.length === 0) {
      try {
        const adminClient = createAdminClient();
        const { data: adminTasks } = await (adminClient.from("tasks") as any)
          .select(
            "id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });
        if (adminTasks && adminTasks.length > 0) {
          return adminTasks;
        }
      } catch {}
    }

    return rawTasks || [];
  }

  async getManagerDashboardTasks(
    orgId: string,
    managerUserId: string,
    teamId?: string | null
  ): Promise<any[]> {
    if (!this.hasSupabase()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Supabase configuration missing in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return [];
    }

    const client = this.getClient();

    // Resolve manager's assigned teams IN PARALLEL (eliminates sequential round trips)
    const [managedTeamsRes, memberTeamsRes] = await Promise.all([
      (client.from("teams") as any)
        .select("id")
        .eq("org_id", orgId)
        .eq("manager_id", managerUserId),
      (client.from("team_members") as any)
        .select("team_id")
        .eq("user_id", managerUserId),
    ]);

    const managedIds = new Set<string>();
    (managedTeamsRes.data || []).forEach((t: any) => managedIds.add(t.id));
    (memberTeamsRes.data || []).forEach((m: any) => managedIds.add(m.team_id));

    const validTeamIds = Array.from(managedIds);

    let query = (client.from("tasks") as any)
      .select(
        "id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (teamId) {
      query = query.eq("team_id", teamId);
    } else if (validTeamIds.length > 0) {
      query = query.or(
        `team_id.in.(${validTeamIds.join(",")}),created_by.eq.${managerUserId}`
      );
    }

    const { data: rawTasks, error } = await query;

    if (error) {
      console.warn("[getManagerDashboardTasks notice]", error.message);
      try {
        const adminClient = createAdminClient();
        const { data: adminTasks } = await (adminClient.from("tasks") as any)
          .select(
            "id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });
        if (adminTasks && adminTasks.length > 0) return adminTasks;
      } catch {}
      return [];
    }

    if (!rawTasks || rawTasks.length === 0) {
      try {
        const adminClient = createAdminClient();
        const { data: adminTasks } = await (adminClient.from("tasks") as any)
          .select(
            "id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });
        if (adminTasks && adminTasks.length > 0) return adminTasks;
      } catch {}
    }

    return rawTasks || [];
  }

  async getEmployeeTasks(orgId: string, userId: string): Promise<any[]> {
    if (!this.hasSupabase()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Supabase configuration missing in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return [];
    }

    const client = this.getClient();

    // Run assignments lookup and a broad org-task prefetch IN PARALLEL (eliminates sequential waterfall)
    const [assignmentsResult, broadTasksResult] = await Promise.all([
      (client.from("task_assignees") as any)
        .select("task_id")
        .eq("user_id", userId),
      (client.from("tasks") as any)
        .select(
          `
          *,
          task_assignees (
            user_id,
            profiles:user_id (id, full_name, avatar_url)
          )
        `
        )
        .eq("org_id", orgId)
        .eq("created_by", userId)
        .order("created_at", { ascending: false }),
    ]);

    const assignedTaskIds: string[] = ((assignmentsResult.data as any[]) || [])
      .map((a: any) => a.task_id)
      .filter(Boolean);

    let rawTasks: any[] = broadTasksResult.data || [];

    // Fetch additionally assigned tasks not yet in result
    if (assignedTaskIds.length > 0) {
      const existingIds = new Set(rawTasks.map((t: any) => t.id));
      const missingIds = assignedTaskIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        const { data: assignedTasks } = await (client.from("tasks") as any)
          .select(
            `
            *,
            task_assignees (
              user_id,
              profiles:user_id (id, full_name, avatar_url)
            )
          `
          )
          .eq("org_id", orgId)
          .in("id", missingIds)
          .order("created_at", { ascending: false });

        if (assignedTasks) {
          rawTasks = [...rawTasks, ...assignedTasks];
        }
      }
    }

    // Fallback if RLS blocked user-scoped read: strictly check tasks assigned to or created by THIS user via adminClient
    if (rawTasks.length === 0) {
      try {
        const adminClient = createAdminClient();
        const [adminAssigned, adminCreated] = await Promise.all([
          (adminClient.from("task_assignees") as any)
            .select("task_id")
            .eq("user_id", userId),
          (adminClient.from("tasks") as any)
            .select(
              `
              *,
              task_assignees (
                user_id,
                profiles:user_id (id, full_name, avatar_url)
              )
            `
            )
            .eq("org_id", orgId)
            .eq("created_by", userId)
            .order("created_at", { ascending: false }),
        ]);

        let fallbackTasks: any[] = adminCreated.data || [];
        const fallbackAssignedIds: string[] = (
          (adminAssigned.data as any[]) || []
        )
          .map((a: any) => a.task_id)
          .filter(Boolean);

        if (fallbackAssignedIds.length > 0) {
          const existingIds = new Set(fallbackTasks.map((t: any) => t.id));
          const missingIds = fallbackAssignedIds.filter(
            (id) => !existingIds.has(id)
          );
          if (missingIds.length > 0) {
            const { data: moreTasks } = await (adminClient.from("tasks") as any)
              .select(
                `
                *,
                task_assignees (
                  user_id,
                  profiles:user_id (id, full_name, avatar_url)
                )
              `
              )
              .eq("org_id", orgId)
              .in("id", missingIds)
              .order("created_at", { ascending: false });

            if (moreTasks) {
              fallbackTasks = [...fallbackTasks, ...moreTasks];
            }
          }
        }
        if (fallbackTasks.length > 0) {
          return fallbackTasks;
        }
      } catch {}
    }

    return rawTasks;
  }

  async getStatusCounts(
    orgId: string,
    teamId?: string | null
  ): Promise<Record<string, number>> {
    if (!this.hasSupabase()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Supabase configuration missing in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return {};
    }

    const client = this.getClient();
    let query = (client.from("tasks") as any)
      .select("status")
      .eq("org_id", orgId);

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;
    if (error || !data) {
      return {};
    }

    return (data as Array<{ status: string }>).reduce(
      (acc: Record<string, number>, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
      },
      {}
    );
  }
}

export const dashboardRepository = new SupabaseDashboardRepository();

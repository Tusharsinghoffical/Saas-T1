import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";

export interface IDashboardRepository {
  getAdminDashboardTasks(orgId: string, teamId?: string | null): Promise<any[]>;
  getManagerDashboardTasks(orgId: string, managerUserId: string, teamId?: string | null): Promise<any[]>;
  getEmployeeTasks(orgId: string, userId: string): Promise<any[]>;
}

export class SupabaseDashboardRepository implements IDashboardRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  private getClient() {
    try {
      return createAdminClient();
    } catch {
      return createClient();
    }
  }

  async getAdminDashboardTasks(orgId: string, teamId?: string | null): Promise<any[]> {
    if (!this.hasSupabase()) {
      return [
        {
          id: "task-1",
          status: "completed",
          priority: "high",
          due_date: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          team_id: teamId || null,
        },
        {
          id: "task-2",
          status: "in_progress",
          priority: "urgent",
          due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date().toISOString(),
          team_id: teamId || null,
        },
        {
          id: "task-3",
          status: "pending",
          priority: "medium",
          due_date: new Date(Date.now() - 86400000 * 2).toISOString(), // Overdue
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          team_id: teamId || null,
        },
      ];
    }

    const client = this.getClient();
    let query = (client.from("tasks") as any)
      .select("id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data: rawTasks, error } = await query;
    if (error) {
      console.warn("[getAdminDashboardTasks notice]", error.message);
      return [];
    }

    return rawTasks || [];
  }

  async getManagerDashboardTasks(
    orgId: string,
    managerUserId: string,
    teamId?: string | null
  ): Promise<any[]> {
    if (!this.hasSupabase()) {
      return [
        {
          id: "mgr-task-1",
          status: "in_progress",
          priority: "high",
          due_date: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date().toISOString(),
          team_id: teamId || "team-default",
        },
        {
          id: "mgr-task-2",
          status: "completed",
          priority: "medium",
          due_date: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          team_id: teamId || "team-default",
        },
      ];
    }

    const client = this.getClient();

    // 1. Resolve manager's assigned teams
    const { data: managedTeams } = await (client.from("teams") as any)
      .select("id")
      .eq("org_id", orgId)
      .eq("manager_id", managerUserId);

    const { data: memberTeams } = await (client.from("team_members") as any)
      .select("team_id")
      .eq("user_id", managerUserId);

    const managedIds = new Set<string>();
    (managedTeams || []).forEach((t: any) => managedIds.add(t.id));
    (memberTeams || []).forEach((m: any) => managedIds.add(m.team_id));

    const validTeamIds = Array.from(managedIds);

    let query = (client.from("tasks") as any)
      .select("id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (teamId) {
      query = query.eq("team_id", teamId);
    } else if (validTeamIds.length > 0) {
      query = query.or(`team_id.in.(${validTeamIds.join(",")}),created_by.eq.${managerUserId}`);
    }

    const { data: rawTasks, error } = await query;

    if (error) {
      console.warn("[getManagerDashboardTasks notice]", error.message);
      // Fallback: fetch all org tasks
      const { data: fallbackTasks } = await (client.from("tasks") as any)
        .select("id, title, description, status, priority, due_date, created_at, updated_at, team_id, created_by")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      return fallbackTasks || [];
    }

    return rawTasks || [];
  }

  async getEmployeeTasks(orgId: string, userId: string): Promise<any[]> {
    if (!this.hasSupabase()) {
      return [
        {
          id: "task-emp-1",
          title: "Audit customer onboarding telemetry & events",
          description: "Review PostHog funnel metrics and ensure events are firing properly.",
          status: "in_progress",
          priority: "urgent",
          due_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ["telemetry", "posthog"],
          subtasks: [{ id: "st-1", title: "Check signup funnel", completed: true }],
        },
        {
          id: "task-emp-2",
          title: "Prepare Sprint review presentation slides",
          description: "Summarize completed tickets and upcoming sprint velocity.",
          status: "pending",
          priority: "high",
          due_date: new Date(Date.now() + 3600000 * 4).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ["sprint"],
          subtasks: [],
        },
        {
          id: "task-emp-3",
          title: "Implement Groq AI streaming prompt templates",
          description: "Setup Llama 3.3 70B Versatile client in Phase 4.",
          status: "pending",
          priority: "medium",
          due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ["ai", "groq"],
          subtasks: [],
        },
        {
          id: "task-emp-4",
          title: "Test PWA service worker offline caching",
          description: "Verify IndexedDB background sync on mobile devices.",
          status: "pending",
          priority: "low",
          due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ["pwa", "mobile"],
          subtasks: [],
        },
        {
          id: "task-emp-5",
          title: "Set up Tailwind CSS tokens & dark mode toggle",
          description: "Configured primary #4F46E5, urgent #EF4444, and success #22C55E.",
          status: "completed",
          priority: "medium",
          due_date: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          tags: ["ui"],
        },
      ];
    }

    const client = this.getClient();

    // 1. Get task IDs where user is explicitly assigned
    const { data: assignments, error: assignErr } = await (client.from("task_assignees") as any)
      .select("task_id")
      .eq("user_id", userId);

    const assignedTaskIds: string[] = (assignments || []).map((a: any) => a.task_id).filter(Boolean);

    // 2. Fetch tasks matching assigned IDs OR created by this user in this organization
    let tasksQuery = (client.from("tasks") as any)
      .select(`
        *,
        task_assignees (
          user_id,
          profiles:user_id (id, full_name, avatar_url)
        )
      `)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (assignedTaskIds.length > 0) {
      tasksQuery = tasksQuery.or(`id.in.(${assignedTaskIds.join(",")}),created_by.eq.${userId}`);
    } else {
      tasksQuery = tasksQuery.eq("created_by", userId);
    }

    const { data: rawTasks, error: tasksErr } = await tasksQuery;

    if (tasksErr) {
      console.warn("[getEmployeeTasks notice]", tasksErr.message);
      // Fallback query without embedded join
      if (assignedTaskIds.length > 0) {
        const { data: fallbackTasks } = await (client.from("tasks") as any)
          .select("*")
          .eq("org_id", orgId)
          .in("id", assignedTaskIds)
          .order("created_at", { ascending: false });
        return fallbackTasks || [];
      }
      return [];
    }

    return rawTasks || [];
  }
}

export const dashboardRepository = new SupabaseDashboardRepository();

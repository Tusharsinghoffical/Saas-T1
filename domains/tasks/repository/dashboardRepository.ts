import { createClient } from "@/infrastructure/supabase/supabaseServer";

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

    const supabase = createClient();
    let query = (supabase.from("tasks") as any)
      .select("id, status, priority, due_date, created_at, updated_at, team_id")
      .eq("org_id", orgId);

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data: rawTasks, error } = await query;
    if (error) {
      throw new Error(error.message);
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

    const supabase = createClient();

    // 1. Resolve manager's assigned teams
    const { data: managedTeams } = await (supabase.from("teams") as any)
      .select("id")
      .eq("org_id", orgId)
      .eq("manager_id", managerUserId);

    const { data: memberTeams } = await (supabase.from("team_members") as any)
      .select("team_id")
      .eq("user_id", managerUserId);

    const managedIds = new Set<string>();
    (managedTeams || []).forEach((t: any) => managedIds.add(t.id));
    (memberTeams || []).forEach((m: any) => managedIds.add(m.team_id));

    const validTeamIds = Array.from(managedIds);

    // If manager is not assigned to any team yet
    if (validTeamIds.length === 0) {
      return [];
    }

    if (teamId && !managedIds.has(teamId)) {
      throw new Error("Manager cannot access data outside their assigned team scope.");
    }

    const targetTeamIds = teamId ? [teamId] : validTeamIds;

    let { data: rawTasks, error } = await (supabase.from("tasks") as any)
      .select("id, status, priority, due_date, created_at, updated_at, team_id")
      .eq("org_id", orgId)
      .in("team_id", targetTeamIds);

    if (error) {
      throw new Error(error.message);
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

    const supabase = createClient();
    let userTasks: any[] = [];
    let { data, error } = await (supabase.from("tasks") as any)
      .select(`
        *,
        task_assignees!inner (
          user_id
        ),
        task_dependencies!task_id (
          depends_on_task_id
        )
      `)
      .eq("org_id", orgId)
      .eq("task_assignees.user_id", userId);

    if (error) {
      // Resilient fallback without embedded dependencies if relationship is ambiguous
      const { data: fallbackTasks, error: fallbackErr } = await (supabase.from("tasks") as any)
        .select(`
          *,
          task_assignees!inner (
            user_id
          )
        `)
        .eq("org_id", orgId)
        .eq("task_assignees.user_id", userId);

      if (fallbackErr) {
        throw new Error(fallbackErr.message);
      }
      userTasks = fallbackTasks || [];
    } else {
      userTasks = data || [];
    }

    return userTasks;
  }
}

export const dashboardRepository = new SupabaseDashboardRepository();

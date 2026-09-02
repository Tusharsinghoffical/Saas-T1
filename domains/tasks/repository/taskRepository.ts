import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskFilterDTO } from "../entities/Task";

export interface ITaskRepository {
  listTasks(orgId: string, filters: TaskFilterDTO): Promise<{ tasks: Task[]; total: number }>;
  getTaskById(taskId: string, orgId: string): Promise<Task | null>;
  createTask(orgId: string, creatorUserId: string, data: CreateTaskDTO): Promise<Task>;
  updateTask(taskId: string, orgId: string, updates: UpdateTaskDTO): Promise<Task>;
  deleteTask(taskId: string, orgId: string): Promise<boolean>;
  getAssignedUserIds(taskId: string): Promise<string[]>;
  getDependencies(taskId: string): Promise<{ id: string; title: string; status: any }[]>;
  getActiveTaskCountByUser(orgId: string): Promise<Record<string, number>>;
  getOrgWeeklyStats(orgId: string): Promise<{
    completedCount: number;
    overdueCount: number;
    totalActive: number;
    topBlockers: string[];
    adminEmails: string[];
  }>;
}

export class SupabaseTaskRepository implements ITaskRepository {
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

  async listTasks(orgId: string, filters: TaskFilterDTO): Promise<{ tasks: Task[]; total: number }> {
    if (!this.hasSupabase()) {
      const mockTasks: Task[] = [
        {
          id: "task-1",
          orgId,
          title: "Prepare quarterly compliance report",
          description: "Compile Q3 compliance data and share with stakeholders.",
          status: "pending",
          priority: "high",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          createdBy: "22222222-2222-2222-2222-222222222222",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignees: [{ id: "22222222-2222-2222-2222-222222222222", fullName: "Demo Assignee" }],
          dependencies: [],
        },
        {
          id: "task-2",
          orgId,
          title: "Design team workflow dashboard",
          description: "Update Figma and create Stitch tokens.",
          status: "in_progress",
          priority: "medium",
          dueDate: new Date(Date.now() + 172800000).toISOString(),
          createdBy: "22222222-2222-2222-2222-222222222222",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignees: [],
          dependencies: [],
        },
      ];

      return { tasks: mockTasks, total: mockTasks.length };
    }

    const supabase = this.getClient();
    let rawTasks: any[] = [];
    let query = (supabase as any)
      .from("tasks")
      .select(
        `
        *,
        task_assignees (
          user_id,
          profiles:user_id (id, full_name, avatar_url)
        ),
        task_dependencies!task_id (
          depends_on_task_id
        )
      `
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.priority) query = query.eq("priority", filters.priority);
    if (filters.teamId) query = query.eq("team_id", filters.teamId);
    if (filters.search) query = query.ilike("title", `%${filters.search}%`);

    let { data, error } = await query;

    if (error) {
      // Fallback without embedded task_dependencies if schema relationship is ambiguous
      let fallbackQuery = (supabase as any)
        .from("tasks")
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
        .order("created_at", { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

      if (filters.status) fallbackQuery = fallbackQuery.eq("status", filters.status);
      if (filters.priority) fallbackQuery = fallbackQuery.eq("priority", filters.priority);
      if (filters.teamId) fallbackQuery = fallbackQuery.eq("team_id", filters.teamId);
      if (filters.search) fallbackQuery = fallbackQuery.ilike("title", `%${filters.search}%`);

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) {
        console.warn("[listTasks error fallback]", fallbackError.message);
        return { tasks: [], total: 0 };
      }
      rawTasks = fallbackData || [];
    } else {
      rawTasks = data || [];
    }

    let filtered = rawTasks || [];
    if (filters.assigneeId) {
      filtered = filtered.filter((t: any) =>
        t.task_assignees?.some((a: any) => a.user_id === filters.assigneeId)
      );
    }

    const mappedTasks: Task[] = filtered.map((t: any) => ({
      id: t.id,
      orgId: t.org_id,
      teamId: t.team_id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      assignees: (t.task_assignees || []).map((a: any) => ({
        id: a.profiles?.id || a.user_id,
        fullName: a.profiles?.full_name || "Assignee",
        avatarUrl: a.profiles?.avatar_url,
      })),
      dependencyTaskIds: (t.task_dependencies || []).map((d: any) => d.depends_on_task_id),
    }));

    return { tasks: mappedTasks, total: mappedTasks.length };
  }

  async getTaskById(taskId: string, orgId: string): Promise<Task | null> {
    if (!this.hasSupabase()) {
      return {
        id: taskId,
        orgId,
        title: "Demo Task Details",
        description: "This is a detailed view of the requested task in demo mode.",
        status: "in_progress",
        priority: "medium",
        dueDate: new Date().toISOString(),
        createdBy: "22222222-2222-2222-2222-222222222222",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignees: [{ id: "22222222-2222-2222-2222-222222222222", fullName: "Demo Assignee" }],
        dependencies: [],
        comments: [],
        attachments: [],
      };
    }

    const supabase = this.getClient();
    let task: any = null;
    let { data, error } = await (supabase as any)
      .from("tasks")
      .select(
        `
        *,
        task_assignees (
          user_id,
          profiles:user_id (id, full_name, avatar_url)
        ),
        task_dependencies!task_id (
          depends_on_task_id
        ),
        task_comments (
          id, user_id, body, created_at,
          profiles:user_id (id, full_name, avatar_url)
        ),
        task_attachments (
          id, file_url, file_name, created_at
        )
      `
      )
      .eq("id", taskId)
      .eq("org_id", orgId)
      .single();

    if (error) {
      const { data: fallbackTask, error: fallbackError } = await (supabase as any)
        .from("tasks")
        .select(
          `
          *,
          task_assignees (
            user_id,
            profiles:user_id (id, full_name, avatar_url)
          ),
          task_comments (
            id, user_id, body, created_at,
            profiles:user_id (id, full_name, avatar_url)
          ),
          task_attachments (
            id, file_url, file_name, created_at
          )
        `
        )
        .eq("id", taskId)
        .eq("org_id", orgId)
        .single();

      if (!fallbackError && fallbackTask) {
        task = fallbackTask;
      }
    } else {
      task = data;
    }

    if (!task) {
      return null;
    }

    return {
      id: task.id,
      orgId: task.org_id,
      teamId: task.team_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      assignees: (task.task_assignees || []).map((a: any) => ({
        id: a.profiles?.id || a.user_id,
        fullName: a.profiles?.full_name || "Assignee",
        avatarUrl: a.profiles?.avatar_url,
      })),
      assigneeIds: (task.task_assignees || []).map((a: any) => a.user_id),
      dependencyTaskIds: (task.task_dependencies || []).map((d: any) => d.depends_on_task_id),
      comments: (task.task_comments || []).map((c: any) => ({
        id: c.id,
        taskId: task.id,
        content: c.body,
        createdAt: c.created_at,
        author: c.profiles,
      })),
      attachments: task.task_attachments || [],
    };
  }

  async createTask(orgId: string, creatorUserId: string, data: CreateTaskDTO): Promise<Task> {
    if (!this.hasSupabase()) {
      return {
        id: `task-${Date.now()}`,
        orgId,
        teamId: data.teamId || null,
        title: data.title,
        description: data.description || null,
        status: data.status || "pending",
        priority: data.priority || "medium",
        dueDate: data.dueDate || null,
        createdBy: creatorUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assigneeIds: data.assigneeIds || [],
        dependencyTaskIds: data.dependencyTaskIds || [],
      };
    }

    const adminClient = createAdminClient();

    const { data: task, error: taskError } = await (adminClient as any)
      .from("tasks")
      .insert({
        org_id: orgId,
        team_id: data.teamId || null,
        title: data.title,
        description: data.description || null,
        status: data.status || "pending",
        priority: data.priority || "medium",
        due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        created_by: creatorUserId,
      })
      .select()
      .single();

    if (taskError || !task) {
      throw new Error(taskError?.message || "Failed to create task");
    }

    const taskId = task.id;

    // Insert assignees & notifications
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const assigneeRows = data.assigneeIds.map((userId) => ({
        task_id: taskId,
        user_id: userId,
      }));
      await (adminClient as any).from("task_assignees").insert(assigneeRows);

      for (const assignedUserId of data.assigneeIds) {
        await (adminClient as any).from("notifications").insert({
          user_id: assignedUserId,
          type: "task.assigned",
          payload: {
            task_id: taskId,
            task_title: data.title,
            priority: data.priority || "medium",
            actor_name: "Manager / Admin",
            message: `You were assigned to task: ${data.title}`,
          },
        });
      }
    }

    // Insert dependencies
    if (data.dependencyTaskIds && data.dependencyTaskIds.length > 0) {
      const depRows = data.dependencyTaskIds.map((depId) => ({
        task_id: taskId,
        depends_on_task_id: depId,
      }));
      await (adminClient as any).from("task_dependencies").insert(depRows);
    }

    return {
      id: task.id,
      orgId: task.org_id,
      teamId: task.team_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      assigneeIds: data.assigneeIds,
      dependencyTaskIds: data.dependencyTaskIds,
    };
  }

  async updateTask(taskId: string, orgId: string, updates: UpdateTaskDTO): Promise<Task> {
    if (!this.hasSupabase()) {
      return {
        id: taskId,
        orgId,
        title: updates.title || "Updated Task",
        description: updates.description || null,
        priority: updates.priority || "medium",
        status: updates.status || "pending",
        dueDate: updates.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const adminClient = createAdminClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.priority !== undefined) updatePayload.priority = updates.priority;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.dueDate !== undefined)
      updatePayload.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
    if (updates.teamId !== undefined) updatePayload.team_id = updates.teamId;

    const { data: updatedTask, error } = await (adminClient as any)
      .from("tasks")
      .update(updatePayload)
      .eq("id", taskId)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error || !updatedTask) {
      throw new Error(error?.message || "Failed to update task");
    }

    if (updates.assigneeIds !== undefined) {
      await (adminClient as any).from("task_assignees").delete().eq("task_id", taskId);
      if (updates.assigneeIds.length > 0) {
        const rows = updates.assigneeIds.map((uId) => ({ task_id: taskId, user_id: uId }));
        await (adminClient as any).from("task_assignees").insert(rows);
      }
    }

    if (updates.dependencyTaskIds !== undefined) {
      await (adminClient as any).from("task_dependencies").delete().eq("task_id", taskId);
      if (updates.dependencyTaskIds.length > 0) {
        const depRows = updates.dependencyTaskIds.map((depId) => ({
          task_id: taskId,
          depends_on_task_id: depId,
        }));
        await (adminClient as any).from("task_dependencies").insert(depRows);
      }
    }

    return {
      id: updatedTask.id,
      orgId: updatedTask.org_id,
      teamId: updatedTask.team_id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      dueDate: updatedTask.due_date,
      createdBy: updatedTask.created_by,
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at,
    };
  }

  async deleteTask(taskId: string, orgId: string): Promise<boolean> {
    if (!this.hasSupabase()) return true;

    const adminClient = createAdminClient();
    const { error } = await (adminClient as any)
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("org_id", orgId);

    if (error) {
      throw new Error(error.message);
    }
    return true;
  }

  async getAssignedUserIds(taskId: string): Promise<string[]> {
    if (!this.hasSupabase()) return [];

    const supabase = this.getClient();
    const { data: assignments } = await (supabase as any)
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", taskId);

    return (assignments || []).map((a: any) => a.user_id);
  }

  async getDependencies(taskId: string): Promise<{ id: string; title: string; status: any }[]> {
    if (!this.hasSupabase()) return [];

    const supabase = this.getClient();
    const { data: deps } = await (supabase as any)
      .from("task_dependencies")
      .select(`
        depends_on_task_id,
        tasks:depends_on_task_id (id, title, status)
      `)
      .eq("task_id", taskId);

    return (deps || []).map((d: any) => ({
      id: d.tasks?.id || d.depends_on_task_id,
      title: d.tasks?.title || "Prerequisite Task",
      status: d.tasks?.status || "pending",
    }));
  }

  async getActiveTaskCountByUser(orgId: string): Promise<Record<string, number>> {
    if (!this.hasSupabase()) return {};

    const supabase = this.getClient();
    const { data: activeAssignments } = await (supabase.from("task_assignees") as any)
      .select(`
        user_id,
        tasks!inner (
          status,
          org_id
        )
      `)
      .eq("tasks.org_id", orgId)
      .in("tasks.status", ["pending", "in_progress", "in_review"]);

    const countMap: Record<string, number> = {};
    (activeAssignments || []).forEach((a: any) => {
      countMap[a.user_id] = (countMap[a.user_id] || 0) + 1;
    });

    return countMap;
  }

  async getOrgWeeklyStats(orgId: string): Promise<{
    completedCount: number;
    overdueCount: number;
    totalActive: number;
    topBlockers: string[];
    adminEmails: string[];
  }> {
    if (!this.hasSupabase()) {
      return {
        completedCount: 14,
        overdueCount: 1,
        totalActive: 12,
        topBlockers: ["API token generation pending PM review"],
        adminEmails: ["admin@example.com"],
      };
    }

    const adminClient = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const nowMs = Date.now();

    const { data: tasks } = await (adminClient.from("tasks") as any)
      .select("id, title, status, priority, due_date, updated_at, created_at")
      .eq("org_id", orgId);

    const allTasks = tasks || [];
    const completedCount = allTasks.filter(
      (t: any) => t.status === "completed" && t.updated_at >= sevenDaysAgo
    ).length;

    const overdueCount = allTasks.filter(
      (t: any) =>
        t.status !== "completed" &&
        t.due_date &&
        new Date(t.due_date).getTime() < nowMs
    ).length;

    const totalActive = allTasks.filter((t: any) =>
      ["pending", "in_progress", "in_review"].includes(t.status)
    ).length;

    const { data: blockedDeps } = await (adminClient.from("task_dependencies") as any)
      .select(`
        task_id,
        depends_on_task_id,
        tasks!task_dependencies_task_id_fkey (title, status, org_id),
        prereq:tasks!task_dependencies_depends_on_task_id_fkey (title, status)
      `)
      .eq("tasks.org_id", orgId);

    const topBlockers = (blockedDeps || [])
      .filter((d: any) => d.prereq?.status !== "completed")
      .map((d: any) => `"${d.tasks?.title}" waiting on "${d.prereq?.title}"`)
      .slice(0, 3);

    const { data: admins } = await (adminClient.from("profiles") as any)
      .select("id, full_name, auth:id (email)")
      .eq("org_id", orgId)
      .eq("role", "admin");

    const adminEmails = (admins || [])
      .map((a: any) => a.auth?.email)
      .filter(Boolean);

    return {
      completedCount,
      overdueCount,
      totalActive,
      topBlockers: topBlockers.length > 0 ? topBlockers : ["No active blockers detected"],
      adminEmails,
    };
  }
}

export const taskRepository = new SupabaseTaskRepository();

import {
  createClient,
  createAdminClient,
} from "@/infrastructure/supabase/supabaseServer";
import {
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilterDTO,
  TaskReassignment,
  ReassignTaskDTO,
} from "../entities/Task";
import { ValidationError } from "@/shared/errors/domainErrors";

export interface ITaskRepository {
  listTasks(
    orgId: string,
    filters: TaskFilterDTO
  ): Promise<{ tasks: Task[]; total: number }>;
  getTaskById(taskId: string, orgId: string): Promise<Task | null>;
  createTask(
    orgId: string,
    creatorUserId: string,
    data: CreateTaskDTO
  ): Promise<Task>;
  updateTask(
    taskId: string,
    orgId: string,
    updates: UpdateTaskDTO
  ): Promise<Task>;
  deleteTask(taskId: string, orgId: string, actorId?: string): Promise<boolean>;
  reassignTask(
    taskId: string,
    orgId: string,
    actorId: string,
    data: ReassignTaskDTO
  ): Promise<{ task: Task; reassignment: TaskReassignment }>;
  getReassignmentHistory(
    taskId: string,
    orgId: string
  ): Promise<TaskReassignment[]>;
  getAssignedUserIds(taskId: string): Promise<string[]>;
  getDependencies(
    taskId: string
  ): Promise<{ id: string; title: string; status: any }[]>;
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

  private getClient(useAdmin: boolean = false) {
    if (useAdmin) {
      return createAdminClient();
    }
    return createClient();
  }

  private getAdminClient() {
    return createAdminClient();
  }

  async listTasks(
    orgId: string,
    filters: TaskFilterDTO
  ): Promise<{ tasks: Task[]; total: number }> {
    if (!this.hasSupabase()) {
      if (process.env.NODE_ENV === "production") {
        throw new ValidationError(
          "Supabase configuration missing in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      return { tasks: [], total: 0 };
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
        ),
        task_attachments (
          id,
          file_name,
          file_url
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
      // Fallback 1: Query without embedded task_dependencies
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

      if (filters.status)
        fallbackQuery = fallbackQuery.eq("status", filters.status);
      if (filters.priority)
        fallbackQuery = fallbackQuery.eq("priority", filters.priority);
      if (filters.teamId)
        fallbackQuery = fallbackQuery.eq("team_id", filters.teamId);
      if (filters.search)
        fallbackQuery = fallbackQuery.ilike("title", `%${filters.search}%`);

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) {
        // Fallback 2: Direct raw tasks query without joins to guarantee data displays
        let rawQuery = (supabase as any)
          .from("tasks")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .range(filters.offset, filters.offset + filters.limit - 1);

        if (filters.status) rawQuery = rawQuery.eq("status", filters.status);
        if (filters.priority)
          rawQuery = rawQuery.eq("priority", filters.priority);
        if (filters.teamId) rawQuery = rawQuery.eq("team_id", filters.teamId);
        if (filters.search)
          rawQuery = rawQuery.ilike("title", `%${filters.search}%`);
        const { data: rawData, error: rawError } = await rawQuery;
        if (rawError) {
          console.warn("[listTasks raw fallback error]", rawError.message);
          try {
            const adminClient = this.getAdminClient();
            if (adminClient) {
              let adminQuery = (adminClient.from("tasks") as any)
                .select("*")
                .eq("org_id", orgId)
                .order("created_at", { ascending: false })
                .range(filters.offset, filters.offset + filters.limit - 1);
              if (filters.status)
                adminQuery = adminQuery.eq("status", filters.status);
              if (filters.priority)
                adminQuery = adminQuery.eq("priority", filters.priority);
              if (filters.teamId)
                adminQuery = adminQuery.eq("team_id", filters.teamId);
              if (filters.search)
                adminQuery = adminQuery.ilike("title", `%${filters.search}%`);
              const { data: adminTasks } = await adminQuery;
              if (adminTasks && adminTasks.length > 0) {
                rawTasks = adminTasks;
              }
            }
          } catch {}
          if (!rawTasks || rawTasks.length === 0) {
            return { tasks: [], total: 0 };
          }
        } else {
          rawTasks = rawData || [];
        }
      } else {
        rawTasks = fallbackData || [];
      }
    } else {
      rawTasks = data || [];
    }

    if (rawTasks.length === 0) {
      try {
        const adminClient = this.getAdminClient();
        if (adminClient) {
          let adminQuery = (adminClient.from("tasks") as any)
            .select("*")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false })
            .range(filters.offset, filters.offset + filters.limit - 1);
          if (filters.status)
            adminQuery = adminQuery.eq("status", filters.status);
          if (filters.priority)
            adminQuery = adminQuery.eq("priority", filters.priority);
          if (filters.teamId)
            adminQuery = adminQuery.eq("team_id", filters.teamId);
          if (filters.search)
            adminQuery = adminQuery.ilike("title", `%${filters.search}%`);
          const { data: adminTasks } = await adminQuery;
          if (adminTasks && adminTasks.length > 0) {
            rawTasks = adminTasks;
          }
        }
      } catch {}
    }

    // Resilient independent assignee loading if join was not present or empty
    if (
      rawTasks.length > 0 &&
      (!rawTasks[0].task_assignees || rawTasks[0].task_assignees.length === 0)
    ) {
      try {
        const taskIds = rawTasks.map((t: any) => t.id);
        const { data: assigneesData } = await (supabase as any)
          .from("task_assignees")
          .select("task_id, user_id")
          .in("task_id", taskIds);

        if (assigneesData && assigneesData.length > 0) {
          const userIds = Array.from(
            new Set(assigneesData.map((a: any) => a.user_id))
          );
          const { data: profilesData } = await (supabase as any)
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          const profileMap = new Map(
            (profilesData || []).map((p: any) => [p.id, p])
          );
          const assigneesByTask = new Map<string, any[]>();
          for (const a of assigneesData) {
            const list = assigneesByTask.get(a.task_id) || [];
            list.push({
              user_id: a.user_id,
              profiles: profileMap.get(a.user_id) || {
                id: a.user_id,
                full_name: "Member",
                avatar_url: null,
              },
            });
            assigneesByTask.set(a.task_id, list);
          }
          for (const t of rawTasks) {
            if (!t.task_assignees || t.task_assignees.length === 0) {
              t.task_assignees = assigneesByTask.get(t.id) || [];
            }
          }
        }
      } catch (assigneeErr) {
        console.warn("[listTasks assignee hydration notice]", assigneeErr);
      }
    }

    // Auto-seed starter workspace tasks if organization has zero tasks on initial load (non-production only)
    if (
      process.env.NODE_ENV !== "production" &&
      (!rawTasks || rawTasks.length === 0) &&
      !filters.status &&
      !filters.priority &&
      !filters.teamId &&
      !filters.search &&
      !filters.assigneeId
    ) {
      try {
        const { seedWorkspaceDataUseCase } =
          await import("../usecases/seedWorkspaceData");
        const seedResult = await seedWorkspaceDataUseCase(orgId);
        if (seedResult.success && seedResult.tasksCount > 0) {
          const { data: seededTasks } = await (supabase as any)
            .from("tasks")
            .select(
              "id, org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at"
            )
            .eq("org_id", orgId)
            .order("created_at", { ascending: false });
          if (seededTasks && seededTasks.length > 0) {
            rawTasks = seededTasks;
          }
        }
      } catch (seedErr) {
        console.warn("[listTasks auto-seed notice]", seedErr);
      }
    }

    let filtered = rawTasks || [];
    if (!filters.includeDeleted) {
      filtered = filtered.filter((t: any) => !t.deleted_at);
    }
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
      deletedAt: t.deleted_at || null,
      deletedBy: t.deleted_by || null,
      assignees: (t.task_assignees || []).map((a: any) => ({
        id: a.profiles?.id || a.user_id,
        fullName: a.profiles?.full_name || "Assignee",
        avatarUrl: a.profiles?.avatar_url,
      })),
      dependencyTaskIds: (t.task_dependencies || []).map(
        (d: any) => d.depends_on_task_id
      ),
      attachments: (t.task_attachments || []).map((a: any) => ({
        id: a.id,
        fileName: a.file_name || "Resource Link",
        fileUrl: a.file_url,
      })),
      attachmentsCount: (t.task_attachments || []).length,
    }));

    return { tasks: mappedTasks, total: mappedTasks.length };
  }

  async getTaskById(taskId: string, orgId: string): Promise<Task | null> {
    if (!this.hasSupabase()) {
      return {
        id: taskId,
        orgId,
        title: "Demo Task Details",
        description:
          "This is a detailed view of the requested task in demo mode.",
        status: "in_progress",
        priority: "medium",
        dueDate: new Date().toISOString(),
        createdBy: "22222222-2222-2222-2222-222222222222",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignees: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            fullName: "Demo Assignee",
          },
        ],
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
      const { data: fallbackTask, error: fallbackError } = await (
        supabase as any
      )
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
      deletedAt: task.deleted_at || null,
      deletedBy: task.deleted_by || null,
      assignees: (task.task_assignees || []).map((a: any) => ({
        id: a.profiles?.id || a.user_id,
        fullName: a.profiles?.full_name || "Assignee",
        avatarUrl: a.profiles?.avatar_url,
      })),
      assigneeIds: (task.task_assignees || []).map((a: any) => a.user_id),
      dependencyTaskIds: (task.task_dependencies || []).map(
        (d: any) => d.depends_on_task_id
      ),
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

  async createTask(
    orgId: string,
    creatorUserId: string,
    data: CreateTaskDTO
  ): Promise<Task> {
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

  async updateTask(
    taskId: string,
    orgId: string,
    updates: UpdateTaskDTO
  ): Promise<Task> {
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
    if (updates.description !== undefined)
      updatePayload.description = updates.description;
    if (updates.priority !== undefined)
      updatePayload.priority = updates.priority;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.dueDate !== undefined)
      updatePayload.due_date = updates.dueDate
        ? new Date(updates.dueDate).toISOString()
        : null;
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
      await (adminClient as any)
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId);
      if (updates.assigneeIds.length > 0) {
        const rows = updates.assigneeIds.map((uId) => ({
          task_id: taskId,
          user_id: uId,
        }));
        await (adminClient as any).from("task_assignees").insert(rows);
      }
    }

    if (updates.dependencyTaskIds !== undefined) {
      await (adminClient as any)
        .from("task_dependencies")
        .delete()
        .eq("task_id", taskId);
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

  async deleteTask(
    taskId: string,
    orgId: string,
    actorId?: string
  ): Promise<boolean> {
    if (!this.hasSupabase()) return true;

    const adminClient = createAdminClient();

    // Check if task exists and check deleted status
    let existing: any = null;
    const { data: exData, error: fetchError } = await (adminClient as any)
      .from("tasks")
      .select("id, deleted_at")
      .eq("id", taskId)
      .eq("org_id", orgId)
      .single();

    if (fetchError || !exData) {
      const { data: baseData, error: baseErr } = await (adminClient as any)
        .from("tasks")
        .select("id")
        .eq("id", taskId)
        .eq("org_id", orgId)
        .single();
      if (baseErr || !baseData) {
        throw new ValidationError("Task not found.");
      }
      existing = baseData;
    } else {
      existing = exData;
    }

    if (existing?.deleted_at) {
      throw new ValidationError("Task is already deleted.");
    }

    // Soft delete task (with fallback to hard delete if deleted_at not migrated)
    const { error: updateError } = await (adminClient as any)
      .from("tasks")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: actorId || null,
      })
      .eq("id", taskId)
      .eq("org_id", orgId);

    if (updateError) {
      const { error: hardDelErr } = await (adminClient as any)
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("org_id", orgId);
      if (hardDelErr) {
        throw new Error(hardDelErr.message);
      }
    }

    // Clean up dependencies where this task was a prerequisite, preventing blocking traps
    await (adminClient as any)
      .from("task_dependencies")
      .delete()
      .eq("depends_on_task_id", taskId);

    return true;
  }

  async reassignTask(
    taskId: string,
    orgId: string,
    actorId: string,
    data: ReassignTaskDTO
  ): Promise<{ task: Task; reassignment: TaskReassignment }> {
    if (!this.hasSupabase()) {
      const now = new Date().toISOString();
      return {
        task: {
          id: taskId,
          orgId,
          title: "Demo Reassigned Task",
          status: "in_progress",
          priority: "medium",
          teamId: data.teamId || null,
          assigneeIds: data.assigneeId ? [data.assigneeId] : [],
          createdAt: now,
          updatedAt: now,
        },
        reassignment: {
          id: `reassign-${Date.now()}`,
          taskId,
          orgId,
          reassignedBy: actorId,
          fromUserId: null,
          toUserId: data.assigneeId || null,
          fromTeamId: null,
          toTeamId: data.teamId || null,
          reason: data.reason || null,
          createdAt: now,
        },
      };
    }

    const adminClient = createAdminClient();

    // Fetch existing task and assignees
    let existingTask: any = null;
    const { data: exTask, error: fetchErr } = await (adminClient as any)
      .from("tasks")
      .select("id, title, priority, org_id, team_id, deleted_at")
      .eq("id", taskId)
      .eq("org_id", orgId)
      .single();

    if (fetchErr || !exTask) {
      const { data: baseTask, error: baseErr } = await (adminClient as any)
        .from("tasks")
        .select("id, title, priority, org_id, team_id")
        .eq("id", taskId)
        .eq("org_id", orgId)
        .single();
      if (baseErr || !baseTask) {
        throw new ValidationError("Task not found.");
      }
      existingTask = baseTask;
    } else {
      existingTask = exTask;
    }

    if (existingTask.deleted_at) {
      throw new ValidationError("Cannot reassign a deleted task.");
    }

    const { data: currentAssignees } = await (adminClient as any)
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", taskId);

    const isUUID = (val: any): boolean =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        val
      );

    const fromUserId =
      currentAssignees && currentAssignees.length > 0
        ? currentAssignees[0].user_id
        : null;
    const fromTeamId = isUUID(existingTask.team_id) ? existingTask.team_id : null;

    // Resolve targetAssigneeId safely (ensure valid UUID)
    let targetAssigneeId: string | null = null;
    if (data.assigneeId !== undefined) {
      if (data.assigneeId && isUUID(data.assigneeId)) {
        targetAssigneeId = data.assigneeId;
      } else {
        targetAssigneeId = null;
      }
    }
    const toUserId =
      data.assigneeId !== undefined ? targetAssigneeId : fromUserId;

    // Resolve target team_id safely (ensure valid UUID or map slug to team)
    let resolvedTeamId: string | null = null;
    if (data.teamId !== undefined && data.teamId !== null && data.teamId !== "") {
      if (isUUID(data.teamId)) {
        resolvedTeamId = data.teamId;
      } else {
        const DEPT_NAME_MAP: Record<string, string> = {
          "dept-engineering": "Engineering & Tech",
          "dept-product": "Product & Design",
          "dept-qa": "QA & Testing",
          "dept-marketing": "Marketing & Growth",
          "dept-sales": "Sales & Enterprise Ops",
          "dept-operations": "Operations & HR",
        };
        const targetTeamName = DEPT_NAME_MAP[data.teamId] || data.teamId;

        try {
          const { data: existingTeam } = await (adminClient.from("teams") as any)
            .select("id")
            .eq("org_id", orgId)
            .ilike("name", targetTeamName)
            .maybeSingle();

          if (existingTeam?.id && isUUID(existingTeam.id)) {
            resolvedTeamId = existingTeam.id;
          } else {
            const { data: createdTeam, error: createTeamErr } = await (
              adminClient.from("teams") as any
            )
              .insert({
                org_id: orgId,
                name: targetTeamName,
              })
              .select("id")
              .maybeSingle();

            if (!createTeamErr && createdTeam?.id && isUUID(createdTeam.id)) {
              resolvedTeamId = createdTeam.id;
            }
          }
        } catch (teamErr) {
          console.warn("[reassignTask team resolution warning]:", teamErr);
        }
      }
    }
    const toTeamId = data.teamId !== undefined ? resolvedTeamId : fromTeamId;

    // Update task team_id if provided
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.teamId !== undefined) {
      updatePayload.team_id = resolvedTeamId;
    }

    const { data: updatedTask, error: updateErr } = await (adminClient as any)
      .from("tasks")
      .update(updatePayload)
      .eq("id", taskId)
      .eq("org_id", orgId)
      .select()
      .single();

    if (updateErr || !updatedTask) {
      throw new Error(
        updateErr?.message || "Failed to update task during reassignment"
      );
    }

    // Atomic update of assignees if assigneeId provided
    if (data.assigneeId !== undefined) {
      await (adminClient as any)
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId);

      if (targetAssigneeId) {
        await (adminClient as any)
          .from("task_assignees")
          .insert({ task_id: taskId, user_id: targetAssigneeId });

        // Notify new assignee
        try {
          await (adminClient as any).from("notifications").insert({
            user_id: targetAssigneeId,
            type: "task.assigned",
            payload: {
              task_id: taskId,
              task_title: updatedTask.title,
              priority: updatedTask.priority || "medium",
              actor_name: "Manager / Admin",
              message: `Task "${updatedTask.title}" has been reassigned to you.`,
              reason: data.reason || null,
            },
          });
        } catch {}
      }
    }

    // Insert task_reassignments audit record (non-blocking if table not migrated)
    let reassignmentRecord: any = null;
    try {
      const { data: rec, error: auditErr } = await (adminClient as any)
        .from("task_reassignments")
        .insert({
          task_id: taskId,
          org_id: orgId,
          reassigned_by: isUUID(actorId) ? actorId : null,
          from_user_id: isUUID(fromUserId) ? fromUserId : null,
          to_user_id: isUUID(toUserId) ? toUserId : null,
          from_team_id: isUUID(fromTeamId) ? fromTeamId : null,
          to_team_id: isUUID(toTeamId) ? toTeamId : null,
          reason: data.reason || null,
        })
        .select()
        .maybeSingle();

      if (!auditErr && rec) {
        reassignmentRecord = rec;
      } else if (auditErr) {
        console.warn("[reassignTask audit warning - non blocking]:", auditErr.message);
      }
    } catch (auditErr) {
      console.warn("[reassignTask audit exception - non blocking]:", auditErr);
    }

    // Immutable record in activity_logs
    try {
      await (adminClient as any).from("activity_logs").insert({
        org_id: orgId,
        actor_id: isUUID(actorId) ? actorId : null,
        action: "task.reassigned",
        entity: "task",
        entity_id: taskId,
        diff: {
          fromUserId,
          toUserId,
          fromTeamId,
          toTeamId,
          reason: data.reason || null,
        },
      });
    } catch {}

    return {
      task: {
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
        assigneeIds: toUserId ? [toUserId] : [],
      },
      reassignment: {
        id: reassignmentRecord?.id || `reassign-${Date.now()}`,
        taskId,
        orgId,
        reassignedBy: actorId,
        fromUserId,
        toUserId,
        fromTeamId,
        toTeamId,
        reason: data.reason || null,
        createdAt: reassignmentRecord?.created_at || new Date().toISOString(),
      },
    };
  }

  async getReassignmentHistory(
    taskId: string,
    orgId: string
  ): Promise<TaskReassignment[]> {
    if (!this.hasSupabase()) {
      return [];
    }

    const supabase = this.getClient();
    const { data, error } = await (supabase as any)
      .from("task_reassignments")
      .select(
        `
        id,
        task_id,
        org_id,
        reassigned_by,
        reassigned_by_user:reassigned_by (full_name),
        from_user_id,
        from_user:from_user_id (full_name),
        to_user_id,
        to_user:to_user_id (full_name),
        from_team_id,
        from_team:from_team_id (name),
        to_team_id,
        to_team:to_team_id (name),
        reason,
        created_at
      `
      )
      .eq("task_id", taskId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[getReassignmentHistory fallback query]", error.message);
      // Fallback query without joins if relationships aren't loaded in schema cache
      const { data: rawData, error: rawError } = await (supabase as any)
        .from("task_reassignments")
        .select("*")
        .eq("task_id", taskId)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (rawError) return [];
      return (rawData || []).map((r: any) => ({
        id: r.id,
        taskId: r.task_id,
        orgId: r.org_id,
        reassignedBy: r.reassigned_by,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        fromTeamId: r.from_team_id,
        toTeamId: r.to_team_id,
        reason: r.reason,
        createdAt: r.created_at,
      }));
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      taskId: r.task_id,
      orgId: r.org_id,
      reassignedBy: r.reassigned_by,
      reassignedByName: r.reassigned_by_user?.full_name || null,
      fromUserId: r.from_user_id,
      fromUserName: r.from_user?.full_name || null,
      toUserId: r.to_user_id,
      toUserName: r.to_user?.full_name || null,
      fromTeamId: r.from_team_id,
      fromTeamName: r.from_team?.name || null,
      toTeamId: r.to_team_id,
      toTeamName: r.to_team?.name || null,
      reason: r.reason,
      createdAt: r.created_at,
    }));
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

  async getDependencies(
    taskId: string
  ): Promise<{ id: string; title: string; status: any }[]> {
    if (!this.hasSupabase()) return [];

    const supabase = this.getClient();
    const { data: deps } = await (supabase as any)
      .from("task_dependencies")
      .select(
        `
        depends_on_task_id,
        tasks:depends_on_task_id (id, title, status)
      `
      )
      .eq("task_id", taskId);

    return (deps || []).map((d: any) => ({
      id: d.tasks?.id || d.depends_on_task_id,
      title: d.tasks?.title || "Prerequisite Task",
      status: d.tasks?.status || "pending",
    }));
  }

  async getActiveTaskCountByUser(
    orgId: string
  ): Promise<Record<string, number>> {
    if (!this.hasSupabase()) return {};

    const supabase = this.getClient();
    const { data: activeAssignments } = await (
      supabase.from("task_assignees") as any
    )
      .select(
        `
        user_id,
        tasks!inner (
          status,
          org_id
        )
      `
      )
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

    const { data: blockedDeps } = await (
      adminClient.from("task_dependencies") as any
    )
      .select(
        `
        task_id,
        depends_on_task_id,
        tasks!task_dependencies_task_id_fkey (title, status, org_id),
        prereq:tasks!task_dependencies_depends_on_task_id_fkey (title, status)
      `
      )
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
      topBlockers:
        topBlockers.length > 0 ? topBlockers : ["No active blockers detected"],
      adminEmails,
    };
  }
}

export const taskRepository = new SupabaseTaskRepository();

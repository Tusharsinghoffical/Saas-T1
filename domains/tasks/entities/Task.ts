/**
 * Pure Domain Entity: Task & Business Invariants
 * ZERO framework (Next.js), database (Supabase), or I/O imports.
 */

export type TaskStatus = "pending" | "in_progress" | "in_review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskDependency {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface TaskAssignee {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface Task {
  id: string;
  orgId: string;
  teamId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  assignees?: TaskAssignee[];
  assigneeIds?: string[];
  dependencies?: TaskDependency[];
  dependencyTaskIds?: string[];
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  deletedAt?: string | null;
  deletedBy?: string | null;
  comments?: any[];
  attachments?: any[];
}

export interface TaskReassignment {
  id: string;
  taskId: string;
  orgId: string;
  reassignedBy: string | null;
  reassignedByName?: string | null;
  fromUserId: string | null;
  fromUserName?: string | null;
  toUserId: string | null;
  toUserName?: string | null;
  fromTeamId?: string | null;
  fromTeamName?: string | null;
  toTeamId?: string | null;
  toTeamName?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface ReassignTaskDTO {
  assigneeId?: string | null;
  teamId?: string | null;
  reason?: string | null;
}

export interface CreateTaskDTO {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  teamId?: string | null;
  assigneeIds?: string[];
  dependencyTaskIds?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  teamId?: string | null;
  assigneeIds?: string[];
  dependencyTaskIds?: string[];
}

export interface TaskFilterDTO {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  teamId?: string;
  search?: string;
  includeDeleted?: boolean;
  limit: number;
  offset: number;
}

/**
 * Pure Business Rule:
 * Only Admins and Managers are authorized to reassign tasks.
 */
export function canUserReassignTask(role: string): boolean {
  return role === "admin" || role === "manager";
}

/**
 * Pure Business Rule:
 * Only Admins and Managers are authorized to delete tasks.
 */
export function canUserDeleteTask(role: string): boolean {
  return role === "admin" || role === "manager";
}

/**
 * Pure Business Rule:
 * An employee can only update the status of tasks they are assigned to.
 */
export function canEmployeeUpdateTask(
  userId: string,
  assignedUserIds: string[]
): boolean {
  if (!userId || !assignedUserIds || assignedUserIds.length === 0) {
    return false;
  }
  return assignedUserIds.includes(userId);
}

/**
 * Pure Business Rule:
 * A task cannot move to "in_progress" or "completed" if any of its dependency prerequisites are not yet completed.
 */
export function validateDependencyPrerequisites(
  targetStatus: TaskStatus,
  dependencies: { id: string; title: string; status: TaskStatus }[]
): { allowed: boolean; blockingDependencies: { id: string; title: string }[] } {
  if (targetStatus !== "in_progress" && targetStatus !== "completed") {
    return { allowed: true, blockingDependencies: [] };
  }

  const incompletePrereqs = dependencies.filter(
    (dep) => dep.status !== "completed"
  );

  if (incompletePrereqs.length > 0) {
    return {
      allowed: false,
      blockingDependencies: incompletePrereqs.map((d) => ({
        id: d.id,
        title: d.title,
      })),
    };
  }

  return { allowed: true, blockingDependencies: [] };
}


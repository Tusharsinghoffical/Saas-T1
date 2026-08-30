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
  comments?: any[];
  attachments?: any[];
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
  limit: number;
  offset: number;
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

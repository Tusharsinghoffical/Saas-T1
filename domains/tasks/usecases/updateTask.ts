import { RequestContext } from "@/shared/types/context";
import {
  Task,
  UpdateTaskDTO,
  canEmployeeUpdateTask,
  validateDependencyPrerequisites,
} from "../entities/Task";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { invalidateOrgDashboardCache } from "@/infrastructure/redis/redisClient";
import { recordActivityLogUseCase } from "@/domains/activity";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";

export async function updateTaskUseCase(
  context: RequestContext,
  taskId: string,
  updates: UpdateTaskDTO,
  repo: ITaskRepository = taskRepository
): Promise<Task> {
  const isManagerOrAdmin = context.role === "admin" || context.role === "manager";

  // 1. Employee access rule: employees may only update status on tasks they are assigned to
  if (!isManagerOrAdmin) {
    if (
      updates.title !== undefined ||
      updates.description !== undefined ||
      updates.priority !== undefined ||
      updates.dueDate !== undefined ||
      updates.teamId !== undefined ||
      updates.assigneeIds !== undefined ||
      updates.dependencyTaskIds !== undefined
    ) {
      throw new ForbiddenError(
        "Employees are only permitted to update task status (pending, in_progress, in_review, completed)."
      );
    }

    const assignedUserIds = await repo.getAssignedUserIds(taskId);
    const isAssigned = canEmployeeUpdateTask(context.userId, assignedUserIds);

    if (!isAssigned && assignedUserIds.length > 0) {
      throw new ForbiddenError("Forbidden: You can only update tasks assigned to you.");
    }
  }

  // 2. Dependency blocking rule: cannot move to in_progress or completed if dependencies are incomplete
  if (updates.status === "in_progress" || updates.status === "completed") {
    const dependencies = await repo.getDependencies(taskId);
    const validation = validateDependencyPrerequisites(updates.status, dependencies);

    if (!validation.allowed) {
      const blockers = validation.blockingDependencies.map((b) => `"${b.title}"`).join(", ");
      throw new ValidationError(
        `Move Blocked: Cannot move task to ${updates.status} until prerequisite task(s) ${blockers} are Completed.`
      );
    }
  }

  // 3. Persist update in database
  const updatedTask = await repo.updateTask(taskId, context.orgId, updates);

  // 4. Record Activity Log
  const action =
    !isManagerOrAdmin && updates.status
      ? "task.status_changed"
      : "task.updated";

  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action,
    entity: "tasks",
    entityId: taskId,
    diff: updates,
  });

  // 5. Invalidate Dashboard Cache
  await invalidateOrgDashboardCache(context.orgId, updates.teamId);

  return updatedTask;
}

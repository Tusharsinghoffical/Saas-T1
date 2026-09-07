import { RequestContext } from "@/shared/types/context";
import {
  ITaskRepository,
  taskRepository,
} from "../repository/taskRepository";
import {
  Task,
  TaskReassignment,
  ReassignTaskDTO,
  canUserReassignTask,
} from "../entities/Task";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";
import { invalidateOrgDashboardCache } from "@/infrastructure/redis/redisClient";
import { recordActivityLogUseCase } from "@/domains/activity";

export async function reassignTaskUseCase(
  context: RequestContext,
  taskId: string,
  data: ReassignTaskDTO,
  repo: ITaskRepository = taskRepository
): Promise<{
  success: boolean;
  task: Task;
  reassignment: TaskReassignment;
  message: string;
}> {
  // Pure domain invariant check: only Admin and Manager can reassign tasks
  if (!canUserReassignTask(context.role)) {
    throw new ForbiddenError(
      "You do not have permission to reassign tasks. Only Admins and Managers can reassign tasks."
    );
  }

  if (!taskId) {
    throw new ValidationError("Task ID is required.");
  }

  // Must provide at least one reallocation parameter
  if (data.assigneeId === undefined && data.teamId === undefined) {
    throw new ValidationError(
      "Please provide a target employee (assigneeId) or target department (teamId) to reassign."
    );
  }

  const result = await repo.reassignTask(
    taskId,
    context.orgId,
    context.userId,
    data
  );

  // Record immutable activity log for audit stream
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "task.reassigned",
    entity: "tasks",
    entityId: taskId,
    diff: {
      fromUserId: result.reassignment.fromUserId,
      toUserId: result.reassignment.toUserId,
      fromTeamId: result.reassignment.fromTeamId,
      toTeamId: result.reassignment.toTeamId,
      reason: data.reason || null,
    },
  });

  // Invalidate Dashboard Cache
  await invalidateOrgDashboardCache(context.orgId);

  return {
    success: true,
    task: result.task,
    reassignment: result.reassignment,
    message: "Task reassigned successfully.",
  };
}

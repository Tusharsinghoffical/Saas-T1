import { RequestContext } from "@/shared/types/context";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { canUserDeleteTask } from "../entities/Task";
import { ForbiddenError } from "@/shared/errors/domainErrors";
import { invalidateOrgDashboardCache } from "@/infrastructure/redis/redisClient";
import { recordActivityLogUseCase } from "@/domains/activity";

export async function deleteTaskUseCase(
  context: RequestContext,
  taskId: string,
  repo: ITaskRepository = taskRepository
): Promise<{ success: boolean; message: string }> {
  // Pure domain invariant check: only Admin and Manager can delete tasks
  if (!canUserDeleteTask(context.role)) {
    throw new ForbiddenError(
      "You do not have permission to delete tasks. Only Admins and Managers can delete tasks."
    );
  }

  await repo.deleteTask(taskId, context.orgId, context.userId);

  // Record Activity Log
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "task.deleted",
    entity: "tasks",
    entityId: taskId,
    diff: { id: taskId },
  });

  // Invalidate Dashboard Cache
  await invalidateOrgDashboardCache(context.orgId);

  return {
    success: true,
    message: "Task deleted successfully.",
  };
}

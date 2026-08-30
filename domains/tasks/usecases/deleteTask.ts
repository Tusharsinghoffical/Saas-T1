import { RequestContext } from "@/shared/types/context";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { invalidateOrgDashboardCache } from "@/infrastructure/redis/redisClient";
import { recordActivityLogUseCase } from "@/domains/activity";

export async function deleteTaskUseCase(
  context: RequestContext,
  taskId: string,
  repo: ITaskRepository = taskRepository
): Promise<{ success: boolean; message: string }> {
  await repo.deleteTask(taskId, context.orgId);

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

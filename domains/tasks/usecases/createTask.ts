import { RequestContext } from "@/shared/types/context";
import { Task, CreateTaskDTO } from "../entities/Task";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { invalidateOrgDashboardCache } from "@/infrastructure/redis/redisClient";
import { recordActivityLogUseCase } from "@/domains/activity";

export async function createTaskUseCase(
  context: RequestContext,
  data: CreateTaskDTO,
  repo: ITaskRepository = taskRepository
): Promise<Task> {
  const task = await repo.createTask(context.orgId, context.userId, data);

  // Record Activity Log
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "task.created",
    entity: "tasks",
    entityId: task.id,
    diff: { title: data.title, priority: data.priority, status: data.status },
  });

  // Invalidate Dashboard Cache
  await invalidateOrgDashboardCache(context.orgId, data.teamId);

  return task;
}

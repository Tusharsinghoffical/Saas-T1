import { RequestContext } from "@/shared/types/context";
import { Task, CreateTaskDTO } from "../entities/Task";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { invalidateOrgDashboardCache } from "@/infrastructure/redis/redisClient";
import { recordActivityLogUseCase } from "@/domains/activity";

import { ValidationError } from "@/shared/errors/domainErrors";

export async function createTaskUseCase(
  context: RequestContext,
  data: CreateTaskDTO,
  repo: ITaskRepository = taskRepository
): Promise<Task> {
  // Validate that no assignee is a soft-deleted/deactivated employee
  if (data.assigneeIds && data.assigneeIds.length > 0) {
    const profiles = await repo.getProfilesForValidation(data.assigneeIds);
    for (const p of profiles) {
      if (p.deletedAt) {
        throw new ValidationError(
          `Cannot assign task to deactivated user: ${p.fullName || p.id}`
        );
      }
    }
  }

  // If teamId not explicitly provided, resolve creator's team or default
    let resolvedTeamId = data.teamId;
    if (!resolvedTeamId) {
      try {
        const teamId = await repo.getProfileTeamId(context.userId);
        if (teamId) {
          resolvedTeamId = teamId;
        } else {
          resolvedTeamId = await repo.ensureDefaultTeam(context.orgId);
        }
      } catch {
        // Non-blocking fallback
      }
    }

  const taskPayload: CreateTaskDTO = {
    ...data,
    teamId: resolvedTeamId || null,
  };

  const task = await repo.createTask(
    context.orgId,
    context.userId,
    taskPayload
  );

    // Attempt to map task assignees to the same team.
    // If it fails, we still create the task.
    if (data.assigneeIds && data.assigneeIds.length > 0 && resolvedTeamId) {
      for (const assigneeId of data.assigneeIds) {
        try {
          await repo.assignUserToTeam(
            assigneeId,
            context.orgId,
            resolvedTeamId
          );
        } catch {
          // Log and ignore to prevent task creation failure
        }
      }
    }

  // Record Activity Log
  await recordActivityLogUseCase({
    orgId: context.orgId,
    actorId: context.userId,
    action: "task.created",
    entity: "tasks",
    entityId: task.id,
    diff: {
      title: data.title,
      priority: data.priority,
      status: data.status,
      assigneeIds: data.assigneeIds,
    },
  });

  // Invalidate Dashboard Cache
  await invalidateOrgDashboardCache(context.orgId, resolvedTeamId);

  return task;
}

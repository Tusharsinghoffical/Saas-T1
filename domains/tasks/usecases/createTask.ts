import { RequestContext } from "@/shared/types/context";
import { Task, CreateTaskDTO } from "../entities/Task";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { IUserRepository, userRepository } from "@/domains/users/repository/userRepository";
import { invalidateOrgDashboardCache } from "@/infrastructure/redis/redisClient";
import { recordActivityLogUseCase } from "@/domains/activity";

import { ValidationError } from "@/shared/errors/domainErrors";

export async function createTaskUseCase(
  context: RequestContext,
  data: CreateTaskDTO,
  repo: ITaskRepository = taskRepository,
  userRepo: IUserRepository = userRepository
): Promise<Task> {
  // Validate that no assignee is a soft-deleted/deactivated employee
  if (data.assigneeIds && data.assigneeIds.length > 0) {
    const profiles = await Promise.all(
      data.assigneeIds.map((id) => userRepo.getProfileById(id).catch(() => null))
    );
    for (const p of profiles) {
      if (p?.deletedAt) {
        throw new ValidationError(
          `Cannot assign task to deactivated user: ${p.fullName || p.id}`
        );
      }
    }
  }

  // If teamId not explicitly provided, resolve creator's team or default workspace team
  let resolvedTeamId = data.teamId;
  if (!resolvedTeamId) {
    try {
      const profile = await userRepo.getProfileById(context.userId);
      if (profile?.teamId) {
        resolvedTeamId = profile.teamId;
      } else {
        resolvedTeamId = await userRepo.ensureDefaultTeam(context.orgId);
      }
    } catch {
      // Non-blocking fallback
    }
  }

  const taskPayload: CreateTaskDTO = {
    ...data,
    teamId: resolvedTeamId || null,
  };

  const task = await repo.createTask(context.orgId, context.userId, taskPayload);

  // If assignees were specified, ensure they are also assigned to the squad
  if (data.assigneeIds && data.assigneeIds.length > 0 && resolvedTeamId) {
    for (const assigneeId of data.assigneeIds) {
      try {
        await userRepo.assignUserToTeam(assigneeId, context.orgId, resolvedTeamId);
      } catch {
        // Non-blocking
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

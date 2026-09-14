import { RequestContext } from "@/shared/types/context";
import { ITaskRepository, taskRepository } from "../repository/taskRepository";
import { canUserDeleteTask } from "../entities/Task";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";
import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
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

  // Fetch the task first to enforce Manager team isolation
  const task = await repo.getTaskById(taskId, context.orgId);
  if (!task) {
    throw new ValidationError("Task not found.");
  }

  // Prevent IDOR: Managers can only act on tasks within their own team
  if (context.role === "manager") {
    if (!task.teamId) {
      throw new ForbiddenError("Managers cannot delete organization-level tasks.");
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (Boolean(url) && !url.includes("your-project-ref")) {
      const adminClient = createAdminClient();
      const { data: team } = await (adminClient as any)
        .from("teams")
        .select("manager_id")
        .eq("id", task.teamId)
        .single();
  
      if (!team || team.manager_id !== context.userId) {
        throw new ForbiddenError(
          "You do not have permission to delete this task. Managers can only delete tasks belonging to their assigned team."
        );
      }
    }
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

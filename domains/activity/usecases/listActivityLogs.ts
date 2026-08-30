import { RequestContext } from "@/shared/types/context";
import { ActivityLog, ActivityFilterDTO } from "../entities/ActivityLog";
import { IActivityRepository, activityRepository } from "../repository/activityRepository";

export async function listActivityLogsUseCase(
  context: RequestContext,
  filters: ActivityFilterDTO,
  repo: IActivityRepository = activityRepository
): Promise<{
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const { logs, total } = await repo.listLogs(context.orgId, filters);
  const totalPages = Math.ceil(total / filters.limit) || 1;

  return {
    logs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages,
    },
  };
}

import { RequestContext } from "@/shared/types/context";
import { IActivityRepository, activityRepository } from "../repository/activityRepository";

export async function exportActivityLogsCsvUseCase(
  context: RequestContext,
  entity?: string | null,
  action?: string | null,
  repo: IActivityRepository = activityRepository
): Promise<string> {
  const allLogs = await repo.getAllLogsForCsv(context.orgId, entity, action);

  const csvHeader = "ID,Timestamp,Actor,Action,Entity,EntityID,Details\n";
  const csvRows = allLogs
    .map(
      (l) =>
        `"${l.id}","${l.createdAt}","${l.actor?.fullName || "System"}","${l.action}","${l.entity}","${l.entityId || ""}","${JSON.stringify(l.diff || {}).replace(/"/g, '""')}"`
    )
    .join("\n");

  return csvHeader + csvRows;
}

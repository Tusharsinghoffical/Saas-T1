import { recordActivityLogUseCase } from "@/domains/activity";

export interface ActivityLogInput {
  orgId: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: Record<string, any> | null;
}

/**
 * Shared server-side audit logger.
 * Delegates to domains/activity/usecases/recordActivityLog.
 */
export async function writeActivityLog(input: ActivityLogInput): Promise<boolean> {
  return await recordActivityLogUseCase(input);
}

import { ActivityLogInput } from "../entities/ActivityLog";
import { IActivityRepository, activityRepository } from "../repository/activityRepository";

export async function recordActivityLogUseCase(
  input: ActivityLogInput,
  repo: IActivityRepository = activityRepository
): Promise<boolean> {
  return await repo.recordLog(input);
}

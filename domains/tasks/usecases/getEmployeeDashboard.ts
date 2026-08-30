import { RequestContext } from "@/shared/types/context";
import { IDashboardRepository, dashboardRepository } from "../repository/dashboardRepository";

export async function getEmployeeDashboardUseCase(
  context: RequestContext,
  repo: IDashboardRepository = dashboardRepository
): Promise<{
  dueToday: any[];
  upcoming: any[];
  recentlyCompleted: any[];
}> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86400000;
  const sevenDaysFromNow = now.getTime() + 7 * 86400000;
  const sevenDaysAgo = now.getTime() - 7 * 86400000;

  const tasks = await repo.getEmployeeTasks(context.orgId, context.userId);

  const dueToday: any[] = [];
  const upcoming: any[] = [];
  const recentlyCompleted: any[] = [];

  tasks.forEach((t: any) => {
    const dueTime = t.due_date ? new Date(t.due_date).getTime() : null;
    const updatedTime = t.updated_at
      ? new Date(t.updated_at).getTime()
      : new Date(t.created_at).getTime();

    if (t.status === "completed") {
      if (updatedTime >= sevenDaysAgo) {
        recentlyCompleted.push(t);
      }
    } else {
      if (dueTime && dueTime >= startOfToday && dueTime <= endOfToday) {
        dueToday.push(t);
      } else if (dueTime && dueTime > endOfToday && dueTime <= sevenDaysFromNow) {
        upcoming.push(t);
      } else {
        if (dueTime && dueTime < startOfToday) {
          dueToday.push(t);
        } else {
          upcoming.push(t);
        }
      }
    }
  });

  return {
    dueToday,
    upcoming,
    recentlyCompleted,
  };
}

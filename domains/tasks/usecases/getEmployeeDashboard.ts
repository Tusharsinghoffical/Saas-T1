import { RequestContext } from "@/shared/types/context";
import { IDashboardRepository, dashboardRepository } from "../repository/dashboardRepository";
import { IUserRepository, userRepository } from "@/domains/users/repository/userRepository";

export async function getEmployeeDashboardUseCase(
  context: RequestContext,
  repo: IDashboardRepository = dashboardRepository,
  userRepo: IUserRepository = userRepository
): Promise<{
  profile: {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    role: string;
    teamId: string | null;
    teamName: string;
    avatarUrl: string | null;
    joinedAt: string;
  };
  stats: {
    totalAssigned: number;
    completed: number;
    inProgress: number;
    dueToday: number;
    upcoming: number;
    completionRate: number;
  };
  dueToday: any[];
  upcoming: any[];
  recentlyCompleted: any[];
}> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86400000;
  const sevenDaysFromNow = now.getTime() + 7 * 86400000;
  const sevenDaysAgo = now.getTime() - 7 * 86400000;

  // 1. Fetch User Profile & Team Info
  let profileData = null;
  try {
    const members = await userRepo.listOrgMembers(context.orgId);
    profileData = members.find((m) => m.id === context.userId);
  } catch {
    // Non-blocking fallback
  }

  if (!profileData) {
    try {
      profileData = await userRepo.getProfileById(context.userId);
    } catch {
      // Non-blocking fallback
    }
  }

  const employeeCode = `EMP-${(context.userId || "0000").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;
  const fullName = profileData?.fullName || "Employee";
  const email = profileData?.email || context.email || "employee@workspace.com";
  const teamName = profileData?.teamName || "General";
  const teamId = profileData?.teamId || null;
  const joinedAt = profileData?.createdAt || new Date().toISOString();
  const avatarUrl = profileData?.avatarUrl || null;

  // 2. Fetch Tasks
  const tasks = await repo.getEmployeeTasks(context.orgId, context.userId);

  const dueToday: any[] = [];
  const upcoming: any[] = [];
  const recentlyCompleted: any[] = [];

  let inProgressCount = 0;
  let completedCount = 0;

  tasks.forEach((t: any) => {
    const dueTime = t.due_date ? new Date(t.due_date).getTime() : null;
    const updatedTime = t.updated_at
      ? new Date(t.updated_at).getTime()
      : new Date(t.created_at).getTime();

    if (t.status === "in_progress") {
      inProgressCount++;
    } else if (t.status === "completed") {
      completedCount++;
    }

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

  const totalAssigned = tasks.length;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  return {
    profile: {
      id: context.userId,
      employeeCode,
      fullName,
      email,
      role: context.role || "employee",
      teamId,
      teamName,
      avatarUrl,
      joinedAt,
    },
    stats: {
      totalAssigned,
      completed: completedCount,
      inProgress: inProgressCount,
      dueToday: dueToday.length,
      upcoming: upcoming.length,
      completionRate,
    },
    dueToday,
    upcoming,
    recentlyCompleted,
  };
}

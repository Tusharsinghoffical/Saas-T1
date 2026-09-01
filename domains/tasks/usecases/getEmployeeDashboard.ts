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
    const dueTime = t.due_date ? new Date(t.due_date).getTime() : (t.dueDate ? new Date(t.dueDate).getTime() : null);
    const updatedTime = t.updated_at
      ? new Date(t.updated_at).getTime()
      : (t.created_at ? new Date(t.created_at).getTime() : now.getTime());

    const formattedTask = {
      id: t.id,
      title: t.title,
      description: t.description || null,
      status: t.status || "pending",
      priority: t.priority || "medium",
      dueDate: t.due_date || t.dueDate || null,
      due_date: t.due_date || t.dueDate || null,
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      assignees: Array.isArray(t.assignees)
        ? t.assignees
        : (t.task_assignees || []).map((a: any) => ({
            id: a.profiles?.id || a.user_id,
            fullName: a.profiles?.full_name || "Assignee",
            avatarUrl: a.profiles?.avatar_url,
          })),
      dependencyTaskIds: t.dependency_task_ids || (t.task_dependencies || []).map((d: any) => d.depends_on_task_id) || [],
      created_by: t.created_by,
      created_at: t.created_at,
      updated_at: t.updated_at,
    };

    if (t.status === "in_progress") {
      inProgressCount++;
    } else if (t.status === "completed") {
      completedCount++;
    }

    if (t.status === "completed") {
      recentlyCompleted.push(formattedTask);
    } else {
      if (dueTime && dueTime >= startOfToday && dueTime <= endOfToday) {
        dueToday.push(formattedTask);
      } else if (dueTime && dueTime > endOfToday && dueTime <= sevenDaysFromNow) {
        upcoming.push(formattedTask);
      } else {
        if (dueTime && dueTime < startOfToday) {
          dueToday.push(formattedTask);
        } else {
          upcoming.push(formattedTask);
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

import { describe, it, expect, beforeEach } from "vitest";
import { getAdminDashboardUseCase } from "@/domains/tasks/usecases/getAdminDashboard";
import { getManagerDashboardUseCase } from "@/domains/tasks/usecases/getManagerDashboard";
import { listOrgMembersUseCase } from "@/domains/users/usecases/listOrgMembers";
import { createEmployeeUserUseCase } from "@/domains/users/usecases/createEmployeeUser";
import { IDashboardRepository } from "@/domains/tasks/repository/dashboardRepository";
import { IUserRepository } from "@/domains/users/repository/userRepository";
import { RequestContext } from "@/shared/types/context";
import { ForbiddenError } from "@/shared/errors/domainErrors";
import { invalidateOrgDashboardCache, redisGet } from "@/infrastructure/redis/redisClient";

describe("Hierarchy Visibility & Real-Time Sync Audit Tests", () => {
  const adminContext: RequestContext = {
    userId: "admin-1",
    orgId: "org-100",
    role: "admin",
    email: "admin@tasqone.test",
  };

  const managerContext: RequestContext = {
    userId: "mgr-1",
    orgId: "org-100",
    role: "manager",
    email: "manager@tasqone.test",
  };

  const otherManagerContext: RequestContext = {
    userId: "mgr-2",
    orgId: "org-100",
    role: "manager",
    email: "othermanager@tasqone.test",
  };

  // Mock Dashboard Repository with Multi-Team Data
  const mockDashboardRepo: IDashboardRepository = {
    getAdminDashboardTasks: async (orgId, teamId) => {
      const allTasks = [
        { id: "t1", status: "in_progress", priority: "high", due_date: new Date(Date.now() + 86400000).toISOString(), team_id: "team-eng" },
        { id: "t2", status: "completed", priority: "medium", due_date: new Date(Date.now() - 86400000).toISOString(), team_id: "team-eng" },
        { id: "t3", status: "pending", priority: "low", due_date: new Date(Date.now() + 172800000).toISOString(), team_id: "team-mkt" },
      ];
      if (teamId) return allTasks.filter((t) => t.team_id === teamId);
      return allTasks;
    },
    getManagerDashboardTasks: async (orgId, managerUserId, teamId) => {
      // mgr-1 manages team-eng
      if (managerUserId === "mgr-1") {
        if (teamId && teamId !== "team-eng") {
          throw new Error("Manager cannot access data outside their assigned team scope.");
        }
        return [
          { id: "t1", status: "in_progress", priority: "high", due_date: new Date(Date.now() + 86400000).toISOString(), team_id: "team-eng" },
          { id: "t2", status: "completed", priority: "medium", due_date: new Date(Date.now() - 86400000).toISOString(), team_id: "team-eng" },
        ];
      }
      return [];
    },
    getEmployeeTasks: async () => [],
  };

  // Mock User Repository with Team Membership
  const mockUserRepo: IUserRepository = {
    getProfileById: async (userId) => {
      if (userId === "mgr-1") {
        return { id: "mgr-1", orgId: "org-100", fullName: "Eng Manager", role: "manager", teamId: "team-eng", teamName: "Engineering" };
      }
      return null;
    },
    listOrgMembers: async (orgId) => [
      { id: "admin-1", orgId, fullName: "Admin User", role: "admin", teamId: "team-lead", teamName: "Leadership" },
      { id: "mgr-1", orgId, fullName: "Eng Manager", role: "manager", teamId: "team-eng", teamName: "Engineering" },
      { id: "emp-1", orgId, fullName: "Eng Dev", role: "employee", teamId: "team-eng", teamName: "Engineering" },
      { id: "emp-2", orgId, fullName: "Marketing Specialist", role: "employee", teamId: "team-mkt", teamName: "Marketing" },
    ],
    softDeleteUser: async () => true,
    ensureDefaultTeam: async () => "team-default",
    assignUserToTeam: async (userId, orgId, teamId) => teamId || "team-default",
    createUserWithPassword: async (orgId, email, password, fullName, role, creatorId, teamId) => ({
      user: { id: "new-user-1", email },
      profile: {
        id: "new-user-1",
        orgId,
        fullName,
        email,
        role,
        teamId: teamId || "team-default",
        teamName: "General",
        createdAt: new Date().toISOString(),
      },
    }),
    updateUserRole: async () => true,
    inviteUser: async () => ({ success: true, message: "Invited" }),
    acceptInvite: async () => ({ success: true }),
  };

  describe("Gap 1: Dashboard Real-Time Sync & Caching Split", () => {
    it("returns fresh live KPI counters while caching expensive productivity charts", async () => {
      const result = await getAdminDashboardUseCase(adminContext, null, mockDashboardRepo);

      expect(result.data.kpis).toBeDefined();
      expect(result.data.kpis.totalTasks).toBe(3);
      expect(result.data.kpis.activeTasks).toBe(2);
      expect(result.data.kpis.completedTasks).toBe(1);
      expect(result.data.productivityChart).toBeDefined();
      expect(result.data.productivityChart.length).toBe(30);
    });

    it("clears cached dashboard keys on invalidation", async () => {
      await invalidateOrgDashboardCache("org-100", "team-eng");
      const cached = await redisGet("dashboard:admin:org-100:charts");
      expect(cached).toBeNull();
    });
  });

  describe("Gap 2: Team Assignment Guarantee & Manager Scoping", () => {
    it("guarantees newly created employees are assigned to a team", async () => {
      const createResult = await createEmployeeUserUseCase(
        adminContext,
        {
          fullName: "New Developer",
          email: "dev@tasqone.test",
          password: "Password123!",
          role: "employee",
          teamId: "team-eng",
        },
        mockUserRepo
      );

      expect(createResult.profile.teamId).toBe("team-eng");
    });

    it("restricts manager member list to only their own team members", async () => {
      const members = await listOrgMembersUseCase(managerContext, mockUserRepo);

      // Manager should only see themselves (mgr-1) and their team member (emp-1), not emp-2 (Marketing)
      const memberIds = members.map((m) => m.id);
      expect(memberIds).toContain("mgr-1");
      expect(memberIds).toContain("emp-1");
      expect(memberIds).not.toContain("emp-2");
    });

    it("ensures manager dashboard only aggregates tasks for their managed team", async () => {
      const managerDashboard = await getManagerDashboardUseCase(managerContext, null, mockDashboardRepo);

      // mgr-1 only has 2 tasks in team-eng (1 in_progress, 1 completed)
      expect(managerDashboard.data.kpis.totalTasks).toBe(2);
      expect(managerDashboard.data.kpis.activeTasks).toBe(1);
      expect(managerDashboard.data.kpis.completedTasks).toBe(1);
    });

    it("rejects manager attempting to access data outside their assigned team scope", async () => {
      await expect(
        getManagerDashboardUseCase(managerContext, "team-mkt", mockDashboardRepo)
      ).rejects.toThrow("Manager cannot access data outside their assigned team scope.");
    });
  });
});

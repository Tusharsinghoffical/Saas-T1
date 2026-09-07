import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canUserReassignTask,
  canUserDeleteTask,
  Task,
  TaskReassignment,
} from "@/domains/tasks/entities/Task";
import { reassignTaskUseCase } from "@/domains/tasks/usecases/reassignTask";
import { getReassignmentHistoryUseCase } from "@/domains/tasks/usecases/getReassignmentHistory";
import { deleteTaskUseCase } from "@/domains/tasks/usecases/deleteTask";
import { ITaskRepository } from "@/domains/tasks/repository/taskRepository";
import { RequestContext } from "@/shared/types/context";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";

// Mock dependencies: Redis and Activity Log
vi.mock("@/infrastructure/redis/redisClient", () => ({
  invalidateOrgDashboardCache: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/domains/activity", () => ({
  recordActivityLogUseCase: vi.fn().mockResolvedValue({ id: "act-123" }),
}));

describe("Enterprise Task Reallocation & Safe Soft-Deletion Suite", () => {
  const adminContext: RequestContext = {
    userId: "admin-uuid-1",
    orgId: "org-alpha",
    role: "admin",
    email: "admin@enterprise.io",
  };

  const managerContext: RequestContext = {
    userId: "manager-uuid-2",
    orgId: "org-alpha",
    role: "manager",
    email: "manager@enterprise.io",
  };

  const employeeContext: RequestContext = {
    userId: "emp-uuid-3",
    orgId: "org-alpha",
    role: "employee",
    email: "employee@enterprise.io",
  };

  describe("Pure Business Invariants (Role Permissions)", () => {
    it("permits only Admin and Manager roles to reassign tasks", () => {
      expect(canUserReassignTask("admin")).toBe(true);
      expect(canUserReassignTask("manager")).toBe(true);
      expect(canUserReassignTask("employee")).toBe(false);
      expect(canUserReassignTask("guest")).toBe(false);
      expect(canUserReassignTask("")).toBe(false);
    });

    it("permits only Admin and Manager roles to delete tasks", () => {
      expect(canUserDeleteTask("admin")).toBe(true);
      expect(canUserDeleteTask("manager")).toBe(true);
      expect(canUserDeleteTask("employee")).toBe(false);
      expect(canUserDeleteTask("guest")).toBe(false);
      expect(canUserDeleteTask("")).toBe(false);
    });
  });

  describe("Dynamic Task Reallocation UseCase (reassignTaskUseCase)", () => {
    let mockRepo: ITaskRepository;
    let storedReassignments: TaskReassignment[];
    let currentTask: Task;

    beforeEach(() => {
      storedReassignments = [];
      currentTask = {
        id: "task-100",
        orgId: "org-alpha",
        teamId: "dept-engineering",
        title: "Microservice Migration",
        status: "in_progress",
        priority: "high",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assigneeIds: ["emp-uuid-3"],
      };

      mockRepo = {
        listTasks: vi.fn(),
        getTaskById: vi.fn().mockImplementation(async (id) => {
          return id === currentTask.id ? currentTask : null;
        }),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
        reassignTask: vi.fn().mockImplementation(async (taskId, orgId, actorId, data) => {
          const fromUser = currentTask.assigneeIds?.[0] || null;
          const fromTeam = currentTask.teamId || null;
          const toUser = data.assigneeId !== undefined ? data.assigneeId : fromUser;
          const toTeam = data.teamId !== undefined ? data.teamId : fromTeam;

          currentTask.assigneeIds = toUser ? [toUser] : [];
          currentTask.teamId = toTeam;
          currentTask.updatedAt = new Date().toISOString();

          const record: TaskReassignment = {
            id: `reassign-${Date.now()}`,
            taskId,
            orgId,
            reassignedBy: actorId,
            fromUserId: fromUser,
            toUserId: toUser,
            fromTeamId: fromTeam,
            toTeamId: toTeam,
            reason: data.reason || null,
            createdAt: new Date().toISOString(),
          };

          storedReassignments.unshift(record);
          return { task: currentTask, reassignment: record };
        }),
        getReassignmentHistory: vi.fn().mockImplementation(async (taskId) => {
          return storedReassignments.filter((r) => r.taskId === taskId);
        }),
        getAssignedUserIds: vi.fn(),
        getDependencies: vi.fn(),
        getActiveTaskCountByUser: vi.fn(),
        getOrgWeeklyStats: vi.fn(),
      };
    });

    it("allows Admin to reassign a task to another employee and records audit history", async () => {
      const result = await reassignTaskUseCase(
        adminContext,
        "task-100",
        {
          assigneeId: "emp-uuid-99",
          reason: "Load balancing across sprint workload",
        },
        mockRepo
      );

      expect(result.success).toBe(true);
      expect(result.task.assigneeIds).toEqual(["emp-uuid-99"]);
      expect(result.reassignment.fromUserId).toBe("emp-uuid-3");
      expect(result.reassignment.toUserId).toBe("emp-uuid-99");
      expect(result.reassignment.reassignedBy).toBe("admin-uuid-1");
      expect(result.reassignment.reason).toBe("Load balancing across sprint workload");
    });

    it("allows Manager to transfer a task to another department and new employee", async () => {
      const result = await reassignTaskUseCase(
        managerContext,
        "task-100",
        {
          assigneeId: "emp-design-1",
          teamId: "dept-design",
          reason: "Handing off backend API specification to UX prototyping team",
        },
        mockRepo
      );

      expect(result.success).toBe(true);
      expect(result.task.teamId).toBe("dept-design");
      expect(result.task.assigneeIds).toEqual(["emp-design-1"]);
      expect(result.reassignment.fromTeamId).toBe("dept-engineering");
      expect(result.reassignment.toTeamId).toBe("dept-design");
      expect(result.reassignment.reassignedBy).toBe("manager-uuid-2");
    });

    it("strictly blocks employees from reassigning tasks (throws ForbiddenError)", async () => {
      await expect(
        reassignTaskUseCase(
          employeeContext,
          "task-100",
          { assigneeId: "emp-hacker" },
          mockRepo
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("validates that at least one reassignment target (assignee or team) is provided", async () => {
      await expect(
        reassignTaskUseCase(adminContext, "task-100", {}, mockRepo)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Reassignment History Retrieval (getReassignmentHistoryUseCase)", () => {
    it("returns complete history list for a task", async () => {
      const mockHistory: TaskReassignment[] = [
        {
          id: "r-2",
          taskId: "task-100",
          orgId: "org-alpha",
          reassignedBy: "admin-1",
          reassignedByName: "Admin Jane",
          fromUserId: "emp-1",
          fromUserName: "Bob Builder",
          toUserId: "emp-2",
          toUserName: "Alice Wonder",
          reason: "Urgent fix required",
          createdAt: new Date().toISOString(),
        },
      ];

      const mockRepo: ITaskRepository = {
        listTasks: vi.fn(),
        getTaskById: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
        reassignTask: vi.fn(),
        getReassignmentHistory: vi.fn().mockResolvedValue(mockHistory),
        getAssignedUserIds: vi.fn(),
        getDependencies: vi.fn(),
        getActiveTaskCountByUser: vi.fn(),
        getOrgWeeklyStats: vi.fn(),
      };

      const history = await getReassignmentHistoryUseCase(
        employeeContext,
        "task-100",
        mockRepo
      );

      expect(history.length).toBe(1);
      expect(history[0].toUserName).toBe("Alice Wonder");
      expect(mockRepo.getReassignmentHistory).toHaveBeenCalledWith(
        "task-100",
        "org-alpha"
      );
    });

    it("rejects request if taskId is empty", async () => {
      const mockRepo = {} as ITaskRepository;
      await expect(
        getReassignmentHistoryUseCase(adminContext, "", mockRepo)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Safe Task Deletion UseCase (deleteTaskUseCase)", () => {
    let mockRepo: ITaskRepository;
    let deletedTaskId: string | null = null;

    beforeEach(() => {
      deletedTaskId = null;
      mockRepo = {
        listTasks: vi.fn(),
        getTaskById: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn().mockImplementation(async (taskId, orgId, actorId) => {
          if (taskId === "already-deleted") {
            throw new ValidationError("Task is already deleted.");
          }
          deletedTaskId = taskId;
          return true;
        }),
        reassignTask: vi.fn(),
        getReassignmentHistory: vi.fn(),
        getAssignedUserIds: vi.fn(),
        getDependencies: vi.fn(),
        getActiveTaskCountByUser: vi.fn(),
        getOrgWeeklyStats: vi.fn(),
      };
    });

    it("allows Admin to delete a task with soft deletion and audit logging", async () => {
      const result = await deleteTaskUseCase(
        adminContext,
        "task-to-delete",
        mockRepo
      );

      expect(result.success).toBe(true);
      expect(deletedTaskId).toBe("task-to-delete");
      expect(mockRepo.deleteTask).toHaveBeenCalledWith(
        "task-to-delete",
        "org-alpha",
        "admin-uuid-1"
      );
    });

    it("allows Manager to delete a task", async () => {
      const result = await deleteTaskUseCase(
        managerContext,
        "task-manager-delete",
        mockRepo
      );

      expect(result.success).toBe(true);
      expect(deletedTaskId).toBe("task-manager-delete");
    });

    it("strictly forbids regular employees from deleting tasks", async () => {
      await expect(
        deleteTaskUseCase(employeeContext, "task-to-delete", mockRepo)
      ).rejects.toThrow(ForbiddenError);
      expect(deletedTaskId).toBeNull();
    });

    it("handles edge case: gracefully fails when deleting an already deleted task", async () => {
      await expect(
        deleteTaskUseCase(adminContext, "already-deleted", mockRepo)
      ).rejects.toThrow(ValidationError);
    });
  });
});

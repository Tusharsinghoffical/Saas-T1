import { describe, it, expect } from "vitest";
import {
  canEmployeeUpdateTask,
  validateDependencyPrerequisites,
  TaskStatus,
} from "@/domains/tasks/entities/Task";
import { updateTaskUseCase } from "@/domains/tasks/usecases/updateTask";
import { ITaskRepository } from "@/domains/tasks/repository/taskRepository";
import { RequestContext } from "@/shared/types/context";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";

describe("Domain-Driven Structure: Task Business Rules & Invariant Tests", () => {
  it("enforces that employees can only update tasks assigned to them", () => {
    const employeeId = "emp-123";
    const assignedUserIds = ["emp-123", "emp-456"];
    const unassignedUserIds = ["emp-789", "emp-999"];

    expect(canEmployeeUpdateTask(employeeId, assignedUserIds)).toBe(true);
    expect(canEmployeeUpdateTask(employeeId, unassignedUserIds)).toBe(false);
    expect(canEmployeeUpdateTask(employeeId, [])).toBe(false);
  });

  it("blocks transition to 'in_progress' or 'completed' if dependencies are incomplete", () => {
    const incompleteDeps: { id: string; title: string; status: TaskStatus }[] = [
      { id: "dep-1", title: "API Backend Implementation", status: "completed" },
      { id: "dep-2", title: "Security Review", status: "in_progress" },
    ];

    const completedDeps: { id: string; title: string; status: TaskStatus }[] = [
      { id: "dep-1", title: "API Backend Implementation", status: "completed" },
      { id: "dep-2", title: "Security Review", status: "completed" },
    ];

    // Attempting to move to in_progress with incomplete dependencies
    const resultInProgress = validateDependencyPrerequisites("in_progress", incompleteDeps);
    expect(resultInProgress.allowed).toBe(false);
    expect(resultInProgress.blockingDependencies.length).toBe(1);
    expect(resultInProgress.blockingDependencies[0].title).toBe("Security Review");

    // Attempting to move to completed with incomplete dependencies
    const resultCompleted = validateDependencyPrerequisites("completed", incompleteDeps);
    expect(resultCompleted.allowed).toBe(false);
    expect(resultCompleted.blockingDependencies[0].id).toBe("dep-2");

    // All dependencies complete
    const allowedResult = validateDependencyPrerequisites("completed", completedDeps);
    expect(allowedResult.allowed).toBe(true);
    expect(allowedResult.blockingDependencies.length).toBe(0);

    // Moving to pending is always allowed regardless of dependencies
    const pendingResult = validateDependencyPrerequisites("pending", incompleteDeps);
    expect(pendingResult.allowed).toBe(true);
  });

  it("enforces employee role restrictions inside updateTaskUseCase", async () => {
    const mockRepo: ITaskRepository = {
      listTasks: async () => ({ tasks: [], total: 0 }),
      getTaskById: async () => null,
      createTask: async () => ({} as any),
      updateTask: async (id, orgId, updates) => ({
        id,
        orgId,
        title: "Test Task",
        status: updates.status || "pending",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      deleteTask: async () => true,
      getAssignedUserIds: async () => ["emp-owner"],
      getDependencies: async () => [],
      getActiveTaskCountByUser: async () => ({}),
      getOrgWeeklyStats: async () => ({
        completedCount: 0,
        overdueCount: 0,
        totalActive: 0,
        topBlockers: [],
        adminEmails: [],
      }),
    };

    const employeeContext: RequestContext = {
      userId: "emp-stranger",
      orgId: "org-1",
      role: "employee",
      email: "stranger@tasqone.local",
    };

    // 1. Employee attempting to update non-status field should throw ForbiddenError
    await expect(
      updateTaskUseCase(
        employeeContext,
        "task-1",
        { title: "Unauthorized title change" },
        mockRepo
      )
    ).rejects.toThrow(ForbiddenError);

    // 2. Employee not assigned to task attempting to change status should throw ForbiddenError
    await expect(
      updateTaskUseCase(
        employeeContext,
        "task-1",
        { status: "completed" },
        mockRepo
      )
    ).rejects.toThrow(ForbiddenError);

    // 3. Assigned employee updating status should succeed
    const assignedEmployeeContext: RequestContext = {
      userId: "emp-owner",
      orgId: "org-1",
      role: "employee",
      email: "owner@tasqone.local",
    };

    const updated = await updateTaskUseCase(
      assignedEmployeeContext,
      "task-1",
      { status: "completed" },
      mockRepo
    );

    expect(updated.status).toBe("completed");
  });

  it("enforces dependency prerequisite validation in updateTaskUseCase", async () => {
    const mockRepo: ITaskRepository = {
      listTasks: async () => ({ tasks: [], total: 0 }),
      getTaskById: async () => null,
      createTask: async () => ({} as any),
      updateTask: async (id, orgId, updates) => ({
        id,
        orgId,
        title: "Test Task",
        status: updates.status || "pending",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      deleteTask: async () => true,
      getAssignedUserIds: async () => ["admin-1"],
      getDependencies: async () => [
        { id: "prereq-1", title: "Database Migration", status: "in_progress" },
      ],
      getActiveTaskCountByUser: async () => ({}),
      getOrgWeeklyStats: async () => ({
        completedCount: 0,
        overdueCount: 0,
        totalActive: 0,
        topBlockers: [],
        adminEmails: [],
      }),
    };

    const adminContext: RequestContext = {
      userId: "admin-1",
      orgId: "org-1",
      role: "admin",
      email: "admin@tasqone.local",
    };

    // Admin attempting to mark task as completed while prerequisite is incomplete
    await expect(
      updateTaskUseCase(
        adminContext,
        "task-1",
        { status: "completed" },
        mockRepo
      )
    ).rejects.toThrow(ValidationError);
  });
});

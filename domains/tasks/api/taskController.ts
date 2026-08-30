import { requireAuth, requireRole } from "@/shared/middleware/rbacGuard";
import {
  createTaskSchema,
  updateTaskSchema,
  employeeStatusUpdateSchema,
  taskFilterSchema,
} from "@/lib/validators/task";
import { listTasksUseCase } from "../usecases/listTasks";
import { createTaskUseCase } from "../usecases/createTask";
import { getTaskByIdUseCase } from "../usecases/getTaskById";
import { updateTaskUseCase } from "../usecases/updateTask";
import { deleteTaskUseCase } from "../usecases/deleteTask";
import { ValidationError } from "@/shared/errors/domainErrors";

export class TaskController {
  async listTasks(searchParams: URLSearchParams) {
    const auth = await requireAuth();

    const filterResult = taskFilterSchema.safeParse({
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      teamId: searchParams.get("teamId") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    if (!filterResult.success) {
      throw new ValidationError(
        filterResult.error.issues[0]?.message || "Invalid task filter parameters"
      );
    }

    return await listTasksUseCase(auth, filterResult.data);
  }

  async getTask(taskId: string) {
    const auth = await requireAuth();
    return await getTaskByIdUseCase(auth, taskId);
  }

  async createTask(body: any) {
    const auth = await requireRole(["admin", "manager"]);

    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues[0]?.message || "Invalid task creation data"
      );
    }

    return await createTaskUseCase(auth, validation.data);
  }

  async updateTask(taskId: string, body: any) {
    const auth = await requireAuth();

    const isManagerOrAdmin = auth.role === "admin" || auth.role === "manager";
    let validatedData: any;

    if (!isManagerOrAdmin) {
      const employeeValidation = employeeStatusUpdateSchema.safeParse(body);
      if (!employeeValidation.success) {
        throw new ValidationError(
          "Employees are only permitted to update task status (pending, in_progress, in_review, completed)."
        );
      }
      validatedData = employeeValidation.data;
    } else {
      const validation = updateTaskSchema.safeParse(body);
      if (!validation.success) {
        throw new ValidationError(
          validation.error.issues[0]?.message || "Invalid task update data"
        );
      }
      validatedData = validation.data;
    }

    return await updateTaskUseCase(auth, taskId, validatedData);
  }

  async deleteTask(taskId: string) {
    const auth = await requireRole(["admin", "manager"]);
    return await deleteTaskUseCase(auth, taskId);
  }
}

export const taskController = new TaskController();

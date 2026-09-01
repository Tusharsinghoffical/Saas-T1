import { z } from "zod";

export const taskPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusEnum = z.enum(["pending", "in_progress", "in_review", "completed"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  priority: taskPriorityEnum.optional().default("medium"),
  status: taskStatusEnum.optional().default("pending"),
  dueDate: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional().default([]),
  dependencyTaskIds: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  dependencyTaskIds: z.array(z.string()).optional(),
});

export const employeeStatusUpdateSchema = z.object({
  status: taskStatusEnum,
});

export const taskFilterSchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assigneeId: z
    .string()
    .optional()
    .transform((val) => (val === "all" || !val ? undefined : val)),
  teamId: z
    .string()
    .optional()
    .transform((val) => (val === "all" || !val ? undefined : val)),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type EmployeeStatusUpdateInput = z.infer<typeof employeeStatusUpdateSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;

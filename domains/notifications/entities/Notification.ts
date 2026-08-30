/**
 * Pure Domain Entities: Notification & NotificationPreferences
 * ZERO framework or database imports.
 */

export interface NotificationPayload {
  task_id?: string;
  task_title?: string;
  priority?: string;
  actor_name?: string;
  message?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  payload: NotificationPayload | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  task_assigned?: boolean;
  task_mentioned?: boolean;
  task_due_soon?: boolean;
  task_overdue?: boolean;
  [key: string]: boolean | undefined;
}

export interface DispatchNotificationDTO {
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  taskId?: string;
}

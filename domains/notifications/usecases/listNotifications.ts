import { RequestContext } from "@/shared/types/context";
import { Notification } from "../entities/Notification";
import { INotificationRepository, notificationRepository } from "../repository/notificationRepository";

export async function listNotificationsUseCase(
  context: RequestContext,
  repo: INotificationRepository = notificationRepository
): Promise<Notification[]> {
  return await repo.listNotifications(context.userId);
}

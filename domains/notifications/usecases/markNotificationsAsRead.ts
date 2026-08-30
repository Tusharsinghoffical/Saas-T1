import { RequestContext } from "@/shared/types/context";
import { INotificationRepository, notificationRepository } from "../repository/notificationRepository";

export async function markNotificationsAsReadUseCase(
  context: RequestContext,
  targetId: string = "all",
  repo: INotificationRepository = notificationRepository
): Promise<{ success: boolean; message: string }> {
  await repo.markAsRead(context.userId, targetId);
  return {
    success: true,
    message: targetId === "all" ? "All notifications marked as read." : "Notification marked as read.",
  };
}

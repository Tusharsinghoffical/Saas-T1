import { requireAuth } from "@/shared/middleware/rbacGuard";
import { listNotificationsUseCase } from "../usecases/listNotifications";
import { markNotificationsAsReadUseCase } from "../usecases/markNotificationsAsRead";
import { dispatchEmailNotificationUseCase } from "../usecases/dispatchEmailNotification";

export class NotificationController {
  async listNotifications() {
    const auth = await requireAuth();
    return await listNotificationsUseCase(auth);
  }

  async markAsRead(body: any) {
    const auth = await requireAuth();
    const targetId = body?.id || "all";
    return await markNotificationsAsReadUseCase(auth, targetId);
  }

  async dispatchEmail(body: any) {
    await requireAuth();
    return await dispatchEmailNotificationUseCase(body);
  }
}

export const notificationController = new NotificationController();

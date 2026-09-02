import { requireAuth, requireRole } from "@/shared/middleware/rbacGuard";
import { listNotificationsUseCase } from "../usecases/listNotifications";
import { markNotificationsAsReadUseCase } from "../usecases/markNotificationsAsRead";
import { dispatchEmailNotificationUseCase } from "../usecases/dispatchEmailNotification";
import { userRepository } from "@/domains/users/repository/userRepository";
import { ValidationError, ForbiddenError } from "@/shared/errors/domainErrors";

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
    const auth = await requireRole(["admin", "manager"]);
    const recipientUserId = body?.recipientUserId;
    if (!recipientUserId) {
      throw new ValidationError("recipientUserId is required.");
    }

    const recipientProfile = await userRepository.getProfileById(recipientUserId);
    if (!recipientProfile || recipientProfile.orgId !== auth.orgId) {
      throw new ForbiddenError("Recipient does not belong to your organization.");
    }

    return await dispatchEmailNotificationUseCase(body);
  }
}

export const notificationController = new NotificationController();

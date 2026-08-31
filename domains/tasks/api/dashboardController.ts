import { requireAuth, requireRole } from "@/shared/middleware/rbacGuard";
import { getAdminDashboardUseCase } from "../usecases/getAdminDashboard";
import { getManagerDashboardUseCase } from "../usecases/getManagerDashboard";
import { getEmployeeDashboardUseCase } from "../usecases/getEmployeeDashboard";

export class DashboardController {
  async getAdminDashboard(teamIdParam?: string | null) {
    const auth = await requireRole(["admin"]);
    return await getAdminDashboardUseCase(auth, teamIdParam);
  }

  async getManagerDashboard(teamIdParam?: string | null) {
    const auth = await requireRole(["manager", "admin"]);
    return await getManagerDashboardUseCase(auth, teamIdParam);
  }

  async getEmployeeDashboard() {
    const auth = await requireAuth();
    return await getEmployeeDashboardUseCase(auth);
  }
}

export const dashboardController = new DashboardController();

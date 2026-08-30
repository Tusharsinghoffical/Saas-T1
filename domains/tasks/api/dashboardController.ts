import { requireAuth, requireRole } from "@/shared/middleware/rbacGuard";
import { getAdminDashboardUseCase } from "../usecases/getAdminDashboard";
import { getEmployeeDashboardUseCase } from "../usecases/getEmployeeDashboard";

export class DashboardController {
  async getAdminDashboard(teamIdParam?: string | null) {
    const auth = await requireRole(["admin", "manager"]);
    const isManager = auth.role === "manager";
    const teamId = isManager ? teamIdParam : null;

    return await getAdminDashboardUseCase(auth, teamId);
  }

  async getEmployeeDashboard() {
    const auth = await requireAuth();
    return await getEmployeeDashboardUseCase(auth);
  }
}

export const dashboardController = new DashboardController();

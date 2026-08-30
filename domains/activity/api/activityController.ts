import { requireRole } from "@/shared/middleware/rbacGuard";
import { listActivityLogsUseCase } from "../usecases/listActivityLogs";
import { exportActivityLogsCsvUseCase } from "../usecases/exportActivityLogsCsv";

export class ActivityController {
  async getActivityLogs(searchParams: URLSearchParams) {
    const auth = await requireRole(["admin", "manager"]);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");
    const format = searchParams.get("format");

    if (format === "csv") {
      const csvString = await exportActivityLogsCsvUseCase(auth, entity, action);
      return {
        isCsv: true,
        csvContent: csvString,
      };
    }

    const result = await listActivityLogsUseCase(auth, {
      page,
      limit,
      entity,
      action,
    });

    return {
      isCsv: false,
      data: result.logs,
      pagination: result.pagination,
    };
  }
}

export const activityController = new ActivityController();

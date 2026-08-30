import { NextRequest, NextResponse } from "next/server";
import { dashboardController } from "@/domains/tasks/api/dashboardController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

/**
 * GET /api/v1/dashboard/me
 */
export async function GET(request: NextRequest) {
  try {
    const data = await dashboardController.getEmployeeDashboard();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleAuthError(error);
  }
}

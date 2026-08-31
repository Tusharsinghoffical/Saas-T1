import { NextRequest, NextResponse } from "next/server";
import { dashboardController } from "@/domains/tasks/api/dashboardController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/dashboard/manager
 *
 * Scoped team dashboard analytics for managers and admins.
 * Protected with private Cache-Control headers to prevent CDN leakage.
 */
export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get("teamId");
    const result = await dashboardController.getManagerDashboard(teamId);

    const headers: Record<string, string> = {
      "X-Cache": result.source === "cache" ? "HIT" : "MISS",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };

    return NextResponse.json(
      { success: true, data: result.data, source: result.source },
      { headers }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

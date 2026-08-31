import { NextRequest, NextResponse } from "next/server";
import { activityController } from "@/domains/activity/api/activityController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/activity
 */
export async function GET(request: NextRequest) {
  try {
    const result = await activityController.getActivityLogs(request.nextUrl.searchParams);

    if (result.isCsv) {
      return new NextResponse(result.csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="tasq_activity_export_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

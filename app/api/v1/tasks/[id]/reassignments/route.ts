import { NextRequest, NextResponse } from "next/server";
import { taskController } from "@/domains/tasks/api/taskController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/tasks/[id]/reassignments
 * Fetches the complete immutable history of reallocations for a task.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const history = await taskController.getReassignments(id);
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return handleAuthError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { taskController } from "@/domains/tasks/api/taskController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tasks
 */
export async function GET(request: NextRequest) {
  try {
    const result = await taskController.listTasks(request.nextUrl.searchParams);
    return NextResponse.json({ success: true, data: result.tasks, total: result.total });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/v1/tasks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = await taskController.createTask(body);
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

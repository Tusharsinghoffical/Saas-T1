import { NextRequest, NextResponse } from "next/server";
import { taskController } from "@/domains/tasks/api/taskController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/tasks/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const task = await taskController.getTask(params.id);
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/v1/tasks/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const task = await taskController.updateTask(params.id, body);
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/v1/tasks/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await taskController.deleteTask(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

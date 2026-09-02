import { NextRequest, NextResponse } from "next/server";
import { taskController } from "@/domains/tasks/api/taskController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/tasks/[id]
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const task = await taskController.getTask(id);
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/v1/tasks/[id]
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const task = await taskController.updateTask(id, body);
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/v1/tasks/[id]
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await taskController.deleteTask(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { notificationController } from "@/domains/notifications/api/notificationController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/notifications
 */
export async function GET(request: NextRequest) {
  try {
    const data = await notificationController.listNotifications();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/v1/notifications
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await notificationController.markAsRead(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { notificationController } from "@/domains/notifications/api/notificationController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

/**
 * POST /api/v1/notifications/email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await notificationController.dispatchEmail(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

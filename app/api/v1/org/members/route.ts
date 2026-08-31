import { NextRequest, NextResponse } from "next/server";
import { userController } from "@/domains/users/api/userController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

/**
 * GET /api/v1/org/members
 * Returns active organization members for task assignments and filters.
 */
export async function GET(request: NextRequest) {
  try {
    const members = await userController.getMembers();
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    return handleAuthError(error);
  }
}

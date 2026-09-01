import { NextRequest, NextResponse } from "next/server";
import { userController } from "@/domains/users/api/userController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

/**
 * PATCH /api/v1/org/members/[userId]
 * Updates member role or permissions.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json();
    const result = await userController.updateMember(params.userId, {
      role: body.role,
      teamId: body.teamId || body.team_id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/v1/org/members/[userId]
 * Deactivates / removes member access from organization.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const result = await userController.removeMember(params.userId);
    return NextResponse.json({ success: result });
  } catch (error) {
    return handleAuthError(error);
  }
}

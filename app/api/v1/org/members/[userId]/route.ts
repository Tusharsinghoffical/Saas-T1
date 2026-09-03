import { NextRequest, NextResponse } from "next/server";
import { userController } from "@/domains/users/api/userController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

/**
 * GET /api/v1/org/members/[userId]
 * Fetches single member profile by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const profile = await userController.getProfile(userId);
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/v1/org/members/[userId]
 * Updates member role, team assignment, or both.
 * Accepts: { role?, teamId?, team_id?, teamName? }
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const result = await userController.updateMember(userId, {
      role: body.role,
      teamId: body.teamId || body.team_id,
      teamName: body.teamName || body.team_name,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/v1/org/members/[userId]
 * Deactivates / removes member access from organization.
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const result = await userController.removeMember(userId);
    return NextResponse.json({ success: result });
  } catch (error) {
    return handleAuthError(error);
  }
}

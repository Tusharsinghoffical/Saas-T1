import { NextRequest, NextResponse } from "next/server";
import { userController } from "@/domains/users/api/userController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * POST /api/v1/org/members
 * Creates or invites a new team member to the current organization.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await userController.createMember({
      fullName: body.fullName || body.full_name,
      email: body.email,
      password: body.password,
      role: body.role || "employee",
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { orgController } from "@/domains/organization/api/orgController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

/**
 * GET /api/v1/org/settings
 */
export async function GET(request: NextRequest) {
  try {
    const org = await orgController.getSettings();
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/v1/org/settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await orgController.updateSettings(body);
    return NextResponse.json(
      body?.test ? result : { success: true, data: result }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

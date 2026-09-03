import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/shared/middleware/rbacGuard";
import { seedWorkspaceDataUseCase } from "@/domains/tasks/usecases/seedWorkspaceData";

export const runtime = "nodejs";

/**
 * POST /api/v1/tasks/seed
 * Populates starter tasks, teams, and activity for the authenticated organization.
 */
export async function POST() {
  try {
    const auth = await requireAuth();
    const result = await seedWorkspaceDataUseCase(auth.orgId, auth.userId);

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

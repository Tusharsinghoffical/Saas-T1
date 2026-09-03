import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/shared/middleware/rbacGuard";
import { requestOrgDeletionUseCase } from "@/domains/organization/usecases/requestOrgDeletion";

export const runtime = "nodejs";

/**
 * POST /api/v1/org/delete-request
 * Self-serve organization deletion request for workspace administrators.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(["admin"]);
    const body = await request.json();

    const result = await requestOrgDeletionUseCase(
      auth,
      body?.confirmOrgName,
      body?.reason
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleAuthError(error);
  }
}

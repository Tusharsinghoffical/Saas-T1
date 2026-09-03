import { NextResponse } from "next/server";
import { requireRole, handleAuthError } from "@/shared/middleware/rbacGuard";
import { exportOrgDataUseCase } from "@/domains/organization/usecases/exportOrgData";

export const runtime = "nodejs";

/**
 * GET /api/v1/org/export
 * Self-serve GDPR / CCPA data export for workspace administrators.
 */
export async function GET() {
  try {
    const auth = await requireRole(["admin"]);
    const data = await exportOrgDataUseCase(auth);

    const jsonString = JSON.stringify(data, null, 2);
    const filename = `tasq-one-export-${auth.orgId}-${Date.now()}.json`;

    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

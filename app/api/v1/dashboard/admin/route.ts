import { NextRequest, NextResponse } from "next/server";
import { dashboardController } from "@/domains/tasks/api/dashboardController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/dashboard/admin
 *
 * SECURITY FIX (FAIL 7.9): Replaced "public, s-maxage=60" with
 * "private, no-cache, no-store, must-revalidate".
 *
 * Rationale: Returning Cache-Control: public on an authenticated multi-tenant
 * endpoint allows shared CDN edges (Vercel Edge, Cloudflare) to cache Tenant A's
 * private dashboard analytics and serve them to Tenant B. RFC 9111 §3.5 requires
 * "private" directive for all authenticated responses containing tenant data.
 *
 * Server-side caching is handled by the tenant-scoped Upstash Redis cache in
 * dashboardController → getAdminDashboard(), keyed as:
 *   `dashboard:admin:${orgId}` and `dashboard:admin:${orgId}:team:${teamId}`
 * This key includes orgId, so it is tenant-namespaced (not global). Redis TTL
 * is 60 seconds. The HTTP layer must NOT add any additional public cache.
 */
export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get("teamId");
    const result = await dashboardController.getAdminDashboard(teamId);

    const headers: Record<string, string> = {
      "X-Cache": result.source === "cache" ? "HIT" : "MISS",
      // ── SECURITY FIX: No public CDN caching for private tenant data ──
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };

    return NextResponse.json(
      { success: true, data: result.data, source: result.source },
      { headers }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

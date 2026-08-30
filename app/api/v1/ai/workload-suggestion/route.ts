import { NextRequest, NextResponse } from "next/server";
import { aiController } from "@/domains/tasks/api/aiController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

/**
 * POST /api/v1/ai/workload-suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await aiController.suggestAssignee(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleAuthError(error);
  }
}

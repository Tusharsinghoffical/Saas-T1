import { NextRequest, NextResponse } from "next/server";
import { taskController } from "@/domains/tasks/api/taskController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/tasks/[id]/reassign
 * Reassigns task assignee and/or team department dynamically with full audit logging.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey) {
      const { acquireIdempotencyKey } = await import("@/infrastructure/redis/redisClient");
      const isFirst = await acquireIdempotencyKey(`idemp:reassign:${idempotencyKey}`, 3600);
      if (!isFirst) {
        return NextResponse.json({ success: true, message: "Idempotent request already processed" }, { status: 200 });
      }
    }

    const { id } = await params;
    const body = await request.json();
    const result = await taskController.reassignTask(id, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

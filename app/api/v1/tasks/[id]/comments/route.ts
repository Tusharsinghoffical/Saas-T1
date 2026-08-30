import { NextRequest, NextResponse } from "next/server";
import { commentController } from "@/domains/tasks/api/commentController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/v1/tasks/[id]/comments
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const comments = await commentController.listComments(params.id);
    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/v1/tasks/[id]/comments
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const comment = await commentController.addComment(params.id, body);
    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

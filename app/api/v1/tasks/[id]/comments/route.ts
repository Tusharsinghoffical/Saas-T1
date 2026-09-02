import { NextRequest, NextResponse } from "next/server";
import { commentController } from "@/domains/tasks/api/commentController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/tasks/[id]/comments
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const comments = await commentController.listComments(id);
    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/v1/tasks/[id]/comments
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const comment = await commentController.addComment(id, body);
    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { attachmentController } from "@/domains/tasks/api/attachmentController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/tasks/[id]/attachments
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const attachments = await attachmentController.listAttachments(id);
    return NextResponse.json({ success: true, data: attachments });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/v1/tasks/[id]/attachments
 * Next.js 15: params is now a Promise and must be awaited.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await attachmentController.handleAttachmentAction(id, body);
    const status = body?.action === "save_attachment" ? 201 : 200;
    return NextResponse.json({ success: true, data: result }, { status });
  } catch (error) {
    return handleAuthError(error);
  }
}

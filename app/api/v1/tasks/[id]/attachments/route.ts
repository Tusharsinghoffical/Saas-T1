import { NextRequest, NextResponse } from "next/server";
import { attachmentController } from "@/domains/tasks/api/attachmentController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";

export const runtime = "nodejs";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/v1/tasks/[id]/attachments
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const attachments = await attachmentController.listAttachments(params.id);
    return NextResponse.json({ success: true, data: attachments });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/v1/tasks/[id]/attachments
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const result = await attachmentController.handleAttachmentAction(params.id, body);
    const status = body?.action === "save_attachment" ? 201 : 200;
    return NextResponse.json({ success: true, data: result }, { status });
  } catch (error) {
    return handleAuthError(error);
  }
}

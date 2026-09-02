import { NextRequest, NextResponse } from "next/server";
import { aiController } from "@/domains/tasks/api/aiController";

export const runtime = "nodejs";

/**
 * GET & POST /api/v1/ai/weekly-summary
 */
export async function GET(request: NextRequest) {
  return handleWeeklySummary(request);
}

export async function POST(request: NextRequest) {
  return handleWeeklySummary(request);
}

async function handleWeeklySummary(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const result = await aiController.weeklySummary(authHeader);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error?.statusCode || (error?.name === "UnauthorizedError" ? 401 : 500);
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

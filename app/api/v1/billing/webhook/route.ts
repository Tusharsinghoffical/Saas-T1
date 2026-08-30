import { NextRequest, NextResponse } from "next/server";
import { billingController } from "@/domains/organization/api/billingController";

export const runtime = "nodejs";

/**
 * POST /api/v1/billing/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");
    const rawBody = await request.text();
    const result = await billingController.handleWebhook(rawBody, signature);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Webhook processing error" },
      { status: err.statusCode || 400 }
    );
  }
}

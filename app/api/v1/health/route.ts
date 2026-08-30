import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "TASQ-ONE",
    version: "1.0.0-mvp",
    infra: "zero-aws-free-tier",
    timestamp: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";
import { authController } from "@/domains/auth/api/authController";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await authController.logout();
  } catch {
    // Non-blocking logout failure
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export async function GET(request: Request) {
  try {
    await authController.logout();
  } catch {
    // Non-blocking logout failure
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

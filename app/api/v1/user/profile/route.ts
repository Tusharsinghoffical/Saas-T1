import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { userController } from "@/domains/users/api/userController";
import { handleAuthError } from "@/shared/middleware/rbacGuard";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Name cannot be empty").max(100).optional(),
  position: z.string().max(100).nullable().optional(),
  phoneNumber: z.string().max(30).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  avatarUrl: z.string().url().nullable().or(z.literal("")).optional(),
});

/**
 * GET /api/v1/user/profile
 * Retrieves authenticated user's personal profile
 */
export async function GET(request: NextRequest) {
  try {
    const profile = await userController.getPersonalProfile();
    return NextResponse.json(
      { success: true, data: profile },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/v1/user/profile
 * Updates authenticated user's personal details (name, position, phone, bio, department)
 */
export async function PATCH(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = updateProfileSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const updated = await userController.updatePersonalProfile(parsed.data);

    // Revalidate Next.js cache so layouts and server components immediately reflect new profile
    try {
      revalidatePath("/", "layout");
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}

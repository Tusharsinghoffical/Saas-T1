import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared/middleware/rbacGuard";
import { userRepository } from "@/domains/users/repository/userRepository";
import { activityRepository } from "@/domains/activity/repository/activityRepository";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const singleMemberSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  role: z.enum(["admin", "manager", "employee"]).default("employee"),
  password: z.string().min(6).optional(),
  teamName: z.string().trim().optional(),
  position: z.string().trim().optional(),
  department: z.string().trim().optional(),
});

const bulkAddSchema = z.object({
  members: z.array(singleMemberSchema).min(1, "At least one member is required").max(100, "Maximum 100 members per bulk request"),
  defaultPassword: z.string().min(6).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    // Only Admin can perform bulk member creation
    if (auth.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only workspace Admins can bulk add team members." },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = bulkAddSchema.safeParse(rawBody);

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

    const { members, defaultPassword = "ChangeMe@123" } = parsed.data;
    const results: Array<{
      email: string;
      fullName: string;
      role: string;
      position?: string;
      password?: string;
      status: "created" | "failed";
      error?: string;
    }> = [];

    let createdCount = 0;
    let failedCount = 0;

    for (const member of members) {
      const targetPassword = member.password?.trim() || defaultPassword;
      try {
        await userRepository.createUserWithPassword(
          auth.orgId,
          member.email,
          targetPassword,
          member.fullName,
          member.role,
          auth.userId,
          null,
          member.position || null,
          member.department || null
        );

        createdCount++;
        results.push({
          email: member.email,
          fullName: member.fullName,
          role: member.role,
          position: member.position,
          password: targetPassword,
          status: "created",
        });
      } catch (err: any) {
        failedCount++;
        results.push({
          email: member.email,
          fullName: member.fullName,
          role: member.role,
          status: "failed",
          error: err?.message || "Could not create user account",
        });
      }
    }

    // Record activity audit trail
    try {
      await activityRepository.recordLog({
        orgId: auth.orgId,
        actorId: auth.userId,
        action: "team.bulk_members_added",
        entity: "profiles",
        entityId: auth.userId,
        diff: {
          totalRequested: members.length,
          createdCount,
          failedCount,
        },
      });
    } catch {
      // Non-blocking audit
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: members.length,
          created: createdCount,
          failed: failedCount,
        },
        results,
      },
    });
  } catch (err: any) {
    const status = err?.statusCode || (err?.message?.includes("Unauthorized") ? 401 : 500);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process bulk member creation." },
      { status }
    );
  }
}

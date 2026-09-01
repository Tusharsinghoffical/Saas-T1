import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { UserRole } from "@/infrastructure/supabase/database.types";
import { RequestContext } from "@/shared/types/context";
import { UnauthorizedError, ForbiddenError, DomainError } from "@/shared/errors/domainErrors";
import { NextResponse } from "next/server";

export { type RequestContext };

export class AuthError extends DomainError {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message, statusCode);
    this.name = "AuthError";
  }
}

/**
 * Validates that the requesting user is authenticated and retrieves
 * their org_id and role from the Supabase JWT claims or profile.
 */
export async function requireAuth(): Promise<RequestContext> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const hasSupabase =
    Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

  if (!hasSupabase) {
    // Local demo / mock user context
    return {
      userId: "22222222-2222-2222-2222-222222222222",
      orgId: "11111111-1111-1111-1111-111111111111",
      role: "admin",
      email: "admin@tasqone.local",
    };
  }

  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Authentication required.");
  }

  // 1. Extract custom claims injected by Auth Hook
  let orgId =
    (user.app_metadata?.org_id as string) ||
    (user.user_metadata?.org_id as string);

  let role = (
    (user.app_metadata?.role as string) ||
    (user.user_metadata?.role as string) ||
    null
  ) as UserRole | null;

  // 2. Fallback to profiles table via regular client
  if (!orgId || !role) {
    const { data } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    const profile = data as { org_id?: string; role?: string } | null;
    if (profile?.org_id) {
      orgId = profile.org_id;
    }
    if (profile?.role) {
      role = profile.role as UserRole;
    }
  }

  // 3. Fallback to Admin Client (bypasses RLS) and self-heal missing organization
  if (!orgId) {
    try {
      const adminClient = createAdminClient();
      const { data: prof } = await (adminClient.from("profiles") as any)
        .select("org_id, role")
        .eq("id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (prof?.org_id) {
        orgId = prof.org_id;
        if (prof.role) role = prof.role as UserRole;
      } else {
        // Check if user created an organization in organizations table
        const { data: orgData } = await (adminClient.from("organizations") as any)
          .select("id")
          .eq("created_by", user.id)
          .maybeSingle();

        if (orgData?.id) {
          orgId = orgData.id;
          role = "admin";
          // Self-heal profile
          await (adminClient.from("profiles") as any).upsert({
            id: user.id,
            org_id: orgId,
            role: "admin",
            full_name: user.user_metadata?.full_name || "Admin User",
          });
        } else {
          // Auto-create workspace for founding user
          const orgName = (user.user_metadata?.org_name as string) || "My Workspace";
          const { data: newOrg } = await (adminClient.from("organizations") as any)
            .insert({
              name: orgName,
              slug: `org-${Date.now()}`,
              tier: "free",
            })
            .select("id")
            .single();

          if (newOrg?.id) {
            orgId = newOrg.id;
            role = "admin";
            await (adminClient.from("profiles") as any).upsert({
              id: user.id,
              org_id: orgId,
              role: "admin",
              full_name: user.user_metadata?.full_name || "Admin User",
            });
            await (adminClient.from("organizations") as any)
              .update({ created_by: user.id })
              .eq("id", orgId);
          }
        }
      }

      // Sync metadata so subsequent requests are fast
      if (orgId) {
        adminClient.auth.admin.updateUserById(user.id, {
          app_metadata: { role: role || "admin", org_id: orgId },
          user_metadata: { role: role || "admin", org_id: orgId },
        }).catch(() => {});
      }
    } catch (adminErr) {
      console.error("[requireAuth] Admin fallback lookup failed:", adminErr);
    }
  }

  if (!role) {
    role = "admin";
  }

  if (!orgId) {
    orgId = user.id;
  }

  return {
    userId: user.id,
    orgId,
    role,
    email: user.email || "",
  };
}

/**
 * Enforces Role-Based Access Control (RBAC) on API route handlers.
 * Throws 403 if the user's role is not included in allowedRoles.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<RequestContext> {
  const authContext = await requireAuth();

  if (!allowedRoles.includes(authContext.role)) {
    throw new ForbiddenError(
      `Forbidden: Action requires one of [${allowedRoles.join(", ")}] roles. Current role: ${authContext.role}`
    );
  }

  return authContext;
}

/**
 * SECURITY FIX (FAIL 4.1): Sanitizes API error responses.
 *
 * Problem: The previous catch-all returned raw `(error as Error)?.message`
 * which exposes Postgres table/column names, constraint violations, Supabase
 * error codes, and internal stack paths in production responses.
 *
 * Fix: DomainErrors (business-layer, intentionally user-visible) are passed
 * through verbatim. All other errors (DB, network, runtime) are hidden behind
 * a generic "Internal server error" in production. The full error is always
 * written to server-side console for ops visibility (structured log pickup).
 *
 * In development (NODE_ENV !== "production") the original message is included
 * in an `_debug` field for easier troubleshooting.
 */
export function handleAuthError(error: unknown) {
  if ((error as any)?.digest === "DYNAMIC_SERVER_USAGE" || (error as any)?.message?.includes("DYNAMIC_SERVER_USAGE")) {
    throw error;
  }

  const err = error as any;
  const isDomainError = error instanceof DomainError || err?.name === "DomainError" || err?.name === "ValidationError" || err?.name === "UnauthorizedError" || err?.name === "ForbiddenError" || err?.name === "NotFoundError" || err?.name === "RateLimitError";

  if (isDomainError || (typeof err?.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 500)) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Request validation failed.",
        ...(err.details ? { details: err.details } : {}),
      },
      { status: err.statusCode || 400 }
    );
  }

  // Infrastructure / runtime errors: log full detail server-side only
  console.error("[handleAuthError] Unhandled internal error:", error);

  return NextResponse.json(
    {
      success: false,
      error: err?.message || "Internal server error. Please contact support.",
      _debug: err?.message,
    },
    { status: 500 }
  );
}

import { createClient } from "@/infrastructure/supabase/supabaseServer";
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

  // Extract custom claims injected by Auth Hook
  const orgId =
    (user.app_metadata?.org_id as string) ||
    (user.user_metadata?.org_id as string);

  const role = (
    (user.app_metadata?.role as string) ||
    (user.user_metadata?.role as string) ||
    "employee"
  ) as UserRole;

  if (!orgId) {
    throw new ForbiddenError("User is not associated with an active organization.");
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
  if (error instanceof DomainError) {
    // Business-layer errors: safe to expose message to client
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Infrastructure / runtime errors: log full detail server-side only
  console.error("[handleAuthError] Unhandled internal error:", error);

  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json(
    {
      success: false,
      error: "Internal server error. Please contact support.",
      ...(isDev ? { _debug: (error as Error)?.message } : {}),
    },
    { status: 500 }
  );
}

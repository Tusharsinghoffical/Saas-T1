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

// In-memory cache for resolved user contexts (15s TTL) to prevent hammering Supabase auth on parallel requests
const authContextCache = new Map<string, { context: RequestContext; expiresAt: number }>();

export function invalidateAuthCache(userId?: string) {
  if (userId) {
    authContextCache.delete(userId);
  } else {
    authContextCache.clear();
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
    throw new UnauthorizedError("Authentication required: Supabase configuration missing.");
  }

  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Authentication required.");
  }

  // Fast L1 Memory Cache Check (0ms)
  const cached = authContextCache.get(user.id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.context;
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

  // 3. Fallback to Admin Client (bypasses RLS) for edge-case lookup only
  // SECURITY: This block ONLY reads — it never creates orgs or assigns roles.
  // Auto-creating orgs was removed: it was a silent privilege escalation vector.
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
      }
      // If still no org, we fall through to the ForbiddenError below.
      // Users with no org must contact their administrator or re-onboard.
    } catch (adminErr) {
      console.error("[requireAuth] Admin fallback lookup failed:", adminErr);
    }
  }

  if (!role) {
    throw new ForbiddenError(
      "Forbidden: User profile is unassigned or role could not be verified."
    );
  }

  if (!orgId) {
    throw new ForbiddenError(
      "Forbidden: Organization membership could not be verified. Please contact your administrator."
    );
  }

  const context: RequestContext = {
    userId: user.id,
    orgId,
    role,
    email: user.email || "",
  };

  // Cache for 15 seconds to eliminate repeated DB lookups on parallel requests
  authContextCache.set(user.id, { context, expiresAt: Date.now() + 15000 });

  return context;
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

  const isProd = process.env.NODE_ENV === "production";

  return NextResponse.json(
    {
      success: false,
      error: isProd
        ? "Internal server error. Please contact support."
        : err?.message || "Internal server error. Please contact support.",
      ...(isProd ? {} : { _debug: err?.message }),
    },
    { status: 500 }
  );
}

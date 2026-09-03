import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type UserRole = "admin" | "manager" | "employee";

/**
 * Pure evaluation helper for 3-way strict RBAC routing.
 * Evaluates whether a role is authorized for a target pathname,
 * returning the appropriate dashboard redirection URL if blocked.
 */
export function evaluateRoleAccess(role: UserRole | string, pathname: string): string | null {
  const isAdminRoute = pathname.startsWith("/admin");
  const isManagerRoute = pathname.startsWith("/manager");
  const isEmployeeRoute = pathname.startsWith("/employee");

  if (!isAdminRoute && !isManagerRoute && !isEmployeeRoute) {
    return null;
  }

  // 1. Role: admin -> Confined to /admin/*
  if (role === "admin") {
    if (isManagerRoute || isEmployeeRoute) {
      return "/admin/dashboard";
    }
    return null;
  }

  // 2. Role: manager -> Confined to /manager/*
  if (role === "manager") {
    if (isAdminRoute || isEmployeeRoute) {
      return "/manager/dashboard";
    }
    return null;
  }

  // 3. Role: employee (default) -> Confined to /employee/*
  if (role === "employee" || !role) {
    if (isAdminRoute || isManagerRoute) {
      return "/employee/dashboard";
    }
    return null;
  }

  return null;
}

/**
 * Evaluates whether an incoming request requires canonical hostname or HTTPS 308 redirection.
 * Preserves query strings and paths, while ignoring local development hosts.
 */
export function evaluateCanonicalRedirect(
  url: URL,
  headers: Headers,
  canonicalAppUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL
): string | null {
  const host = headers.get("x-forwarded-host") || headers.get("host") || url.host;
  const proto = headers.get("x-forwarded-proto") || url.protocol.replace(":", "");

  // Skip local development
  if (
    !host ||
    host.includes("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("0.0.0.0") ||
    host.includes("192.168.")
  ) {
    return null;
  }

  let canonicalHost = "";
  if (canonicalAppUrl) {
    try {
      const parsed = new URL(canonicalAppUrl);
      if (!parsed.host.includes("localhost")) {
        canonicalHost = parsed.host;
      }
    } catch {}
  }

  let targetHost = host;
  let shouldRedirect = false;

  // Check canonical host mismatch (e.g. www vs apex)
  if (canonicalHost && host.toLowerCase() !== canonicalHost.toLowerCase()) {
    const cleanHost = host.toLowerCase().replace(/^www\./, "");
    const cleanCanonical = canonicalHost.toLowerCase().replace(/^www\./, "");
    if (cleanHost === cleanCanonical) {
      targetHost = canonicalHost;
      shouldRedirect = true;
    }
  }

  // Check HTTP -> HTTPS
  if (proto.toLowerCase() === "http") {
    shouldRedirect = true;
  }

  if (shouldRedirect) {
    const search = url.search;
    const pathname = url.pathname;
    return `https://${targetHost}${pathname}${search}`;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  // 1. Enforce canonical hostname & HTTPS permanent redirect (308) in production
  const canonicalRedirectUrl = evaluateCanonicalRedirect(request.nextUrl, request.headers);
  if (canonicalRedirectUrl) {
    return NextResponse.redirect(new URL(canonicalRedirectUrl), 308);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isManagerRoute = pathname.startsWith("/manager");
  const isEmployeeRoute = pathname.startsWith("/employee");
  const isProtectedRoute = isAdminRoute || isManagerRoute || isEmployeeRoute;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const hasSupabase =
    Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

  // Fail-closed: If Supabase configuration is missing, protected routes MUST NOT be accessible
  if (!hasSupabase) {
    if (isProtectedRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "database_unreachable");
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Unauthenticated users cannot access protected workspace routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // ── Email verification enforcement ──
    const isEmailVerified = Boolean(user.email_confirmed_at);
    if (isProtectedRoute && !isEmailVerified) {
      const verifyUrl = new URL("/auth/verify-email", request.url);
      verifyUrl.searchParams.set("email", encodeURIComponent(user.email || ""));
      return NextResponse.redirect(verifyUrl);
    }

    let role =
      (user.app_metadata?.role as string) ||
      (user.user_metadata?.role as string) ||
      null;

    if (!role) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role) {
          role = profile.role as string;
        } else {
          // Principle of least privilege: default to employee, never escalate
          role = "employee";
        }
      } catch {
        role = "employee";
      }
    }

    // 2. Strict 3-Way Cross-Role Confinement
    const redirectPath = evaluateRoleAccess(role, pathname);
    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/manager/:path*",
    "/employee/:path*",
    "/api/v1/:path*",
  ],
};

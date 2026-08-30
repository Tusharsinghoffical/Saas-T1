import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const hasSupabase =
    Boolean(supabaseUrl) && !supabaseUrl.includes("your-project-ref");

  // In local demo / test mode with placeholder keys, allow navigation freely
  if (!hasSupabase) {
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

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isEmployeeRoute = pathname.startsWith("/employee");
  const isProtectedRoute = isAdminRoute || isEmployeeRoute;

  // 1. Unauthenticated users cannot access protected workspace routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // ── SECURITY FIX (FAIL 2.1 / FAIL 3): Email verification enforcement ──
    // Supabase sets email_confirmed_at once the user clicks the confirmation
    // link. Until then, the user has a valid session but an unverified email.
    // Without this check any signup can access workspace routes immediately.
    // The /api/v1/* routes are excluded because some paths (e.g., resend
    // verification) are needed before confirmation.
    const isEmailVerified = Boolean(user.email_confirmed_at);
    if (isProtectedRoute && !isEmailVerified) {
      const verifyUrl = new URL("/auth/verify-email", request.url);
      verifyUrl.searchParams.set("email", encodeURIComponent(user.email || ""));
      return NextResponse.redirect(verifyUrl);
    }

    const role =
      (user.app_metadata?.role as string) ||
      (user.user_metadata?.role as string) ||
      "employee";

    // 2. Employees are blocked from accessing Admin-only routes
    if (isAdminRoute && role === "employee") {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/employee/:path*",
    "/api/v1/:path*",
  ],
};

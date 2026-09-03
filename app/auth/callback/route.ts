import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/supabaseServer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tasq-one.onrender.com";

  let safeOrigin = defaultAppUrl;
  if (
    forwardedHost &&
    !forwardedHost.includes("0.0.0.0") &&
    !forwardedHost.includes("127.0.0.1") &&
    !forwardedHost.includes("localhost")
  ) {
    safeOrigin = `${forwardedProto}://${forwardedHost}`;
  }

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      let role =
        (data.user.app_metadata?.role as string) ||
        (data.user.user_metadata?.role as string);

      if (!role) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const profile = profileData as { role?: string } | null;
        if (profile?.role) {
          role = profile.role;
        }
      }

      const type = searchParams.get("type");
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${safeOrigin}/accept-invite`);
      }

      let targetPath = next;
      // Prevent open redirect: path must start with exactly one '/' (not '//' or '\') and must be relative
      if (
        !targetPath ||
        !targetPath.startsWith("/") ||
        targetPath.startsWith("//") ||
        targetPath.startsWith("\\") ||
        targetPath.includes("://") ||
        /^\/[\\\/]/.test(targetPath)
      ) {
        targetPath = "/employee/dashboard";
      }

      if (targetPath === "/admin/dashboard") {
        if (role === "admin") targetPath = "/admin/dashboard";
        else if (role === "manager") targetPath = "/manager/dashboard";
        // Principle of least privilege: unknown/null role → employee (middleware handles re-routing)
        else targetPath = "/employee/dashboard";
      }

      return NextResponse.redirect(`${safeOrigin}${targetPath}`);
    }
  }

  return NextResponse.redirect(`${safeOrigin}/login?error=Authentication%20failed`);
}

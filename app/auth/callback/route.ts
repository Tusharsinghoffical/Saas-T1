import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/supabaseServer";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin/dashboard";

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
        return NextResponse.redirect(`${origin}/accept-invite`);
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

      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed`);
}

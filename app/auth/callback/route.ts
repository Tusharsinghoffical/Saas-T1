import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      if (next === "/admin/dashboard" || !next) {
        if (role === "employee") targetPath = "/employee/dashboard";
        else if (role === "manager") targetPath = "/manager/dashboard";
        else targetPath = "/admin/dashboard";
      }

      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed`);
}

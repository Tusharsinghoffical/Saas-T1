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
      const role =
        (data.user.app_metadata?.role as string) ||
        (data.user.user_metadata?.role as string) ||
        "admin";

      const targetPath = role === "employee" ? "/employee/dashboard" : next;
      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  // If error or no code, return to login with error
  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed`);
}

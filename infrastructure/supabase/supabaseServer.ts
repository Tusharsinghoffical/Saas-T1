import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createBaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

/**
 * Creates a typed Supabase client for Server Components, Server Actions,
 * and Route Handlers with automatic cookie management.
 * Next.js 15 compatible: cookies() is awaited inside async getAll/setAll methods.
 */
export function createClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet) {
        try {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored if called in Server Component where cookies cannot be written
        }
      },
    },
  });
}

/**
 * Creates an administrative Supabase client using the Service Role Key.
 * MUST ONLY be called in secure server-side contexts.
 */
export function createAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!serviceRoleKey || serviceRoleKey.includes("dummy") || serviceRoleKey.length < 20) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for administrative operations."
    );
  }

  return createBaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

/**
 * Creates a typed Supabase client for browser (Client Component) execution.
 * Uses public anon key.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

import { createClient, createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { SignupCredentials, LoginCredentials } from "../entities/AuthSession";

export interface IAuthRepository {
  signupAdmin(credentials: SignupCredentials): Promise<{ orgId: string; userId: string }>;
  loginPassword(credentials: LoginCredentials): Promise<{ user: any; role: "admin" | "manager" | "employee" }>;
  loginMagicLink(email: string, redirectTo: string): Promise<void>;
  createInitialTask(orgId: string, title: string, priority: string, dueDate?: string | null): Promise<void>;
}

export class SupabaseAuthRepository implements IAuthRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async signupAdmin(credentials: SignupCredentials): Promise<{ orgId: string; userId: string }> {
    if (!this.hasSupabase()) {
      return {
        orgId: "11111111-1111-1111-1111-111111111111",
        userId: "22222222-2222-2222-2222-222222222222",
      };
    }

    const supabase = createClient();
    const adminClient = createAdminClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password || "",
      options: {
        data: {
          full_name: credentials.fullName,
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create authentication user.");
    }

    const userId = authData.user.id;

    const { data: rpcData, error: rpcError } = await (adminClient as any).rpc(
      "signup_organization_admin",
      {
        p_org_name: credentials.orgName,
        p_user_id: userId,
        p_full_name: credentials.fullName,
        p_timezone: credentials.timezone || "Asia/Kolkata",
      }
    );

    if (rpcError) {
      throw new Error(rpcError.message || "Failed to initialize organization workspace.");
    }

    return {
      orgId: (rpcData as any)?.org_id || userId,
      userId,
    };
  }

  async loginPassword(credentials: LoginCredentials): Promise<{ user: any; role: "admin" | "manager" | "employee" }> {
    if (!this.hasSupabase()) {
      const isEmployee = credentials.email.toLowerCase().includes("employee");
      return {
        user: { id: "22222222-2222-2222-2222-222222222222", email: credentials.email },
        role: isEmployee ? "employee" : "admin",
      };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password || "",
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Invalid credentials.");
    }

    const role = (
      (data.user.app_metadata?.role as string) ||
      (data.user.user_metadata?.role as string) ||
      "admin"
    ) as "admin" | "manager" | "employee";

    return {
      user: data.user,
      role,
    };
  }

  async loginMagicLink(email: string, redirectTo: string): Promise<void> {
    if (!this.hasSupabase()) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to send magic link.");
    }
  }

  async createInitialTask(orgId: string, title: string, priority: string, dueDate?: string | null): Promise<void> {
    if (!this.hasSupabase()) return;

    const adminClient = createAdminClient();
    await (adminClient as any).from("tasks").insert({
      org_id: orgId,
      title,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status: "pending",
    });
  }
}

export const authRepository = new SupabaseAuthRepository();

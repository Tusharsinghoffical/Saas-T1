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
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return (
      Boolean(url) &&
      !url.includes("your-project-ref") &&
      Boolean(anonKey) &&
      !anonKey.includes("dummy")
    );
  }

  async signupAdmin(credentials: SignupCredentials): Promise<{ orgId: string; userId: string }> {
    if (!this.hasSupabase()) {
      return {
        orgId: "11111111-1111-1111-1111-111111111111",
        userId: "22222222-2222-2222-2222-222222222222",
      };
    }

    try {
      const supabase = createClient();
      let adminClient: any = null;
      try {
        adminClient = createAdminClient();
      } catch {
        // Fallback if service role key not available or invalid
      }

      let userId: string | null = null;

      // Path A: Use Service Role Admin Client if available (bypasses email signup restrictions)
      if (adminClient) {
        try {
          const { data: adminAuthData, error: adminAuthError } = await adminClient.auth.admin.createUser({
            email: credentials.email,
            password: credentials.password || "",
            email_confirm: true,
            app_metadata: {
              role: "admin",
            },
            user_metadata: {
              full_name: credentials.fullName,
              role: "admin",
            },
          });

          if (adminAuthError) {
            const errMsg = adminAuthError.message.toLowerCase();
            if (errMsg.includes("already registered") || errMsg.includes("already exists") || errMsg.includes("duplicate")) {
              throw new Error("An account with this email address already exists. Please log in instead.");
            }
            // If admin createUser fails with other error, fall through to client signup
          } else if (adminAuthData?.user?.id) {
            userId = adminAuthData.user.id;
          }
        } catch (adminErr: any) {
          if (adminErr.message.includes("already exists")) {
            throw adminErr;
          }
        }
      }

      // Path B: Fallback to standard Supabase client signup if Admin API was not used
      if (!userId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password || "",
          options: {
            data: {
              full_name: credentials.fullName,
              role: "admin",
            },
          },
        });

        if (authError) {
          const errMsg = authError.message.toLowerCase();
          if (errMsg.includes("user not allowed") || errMsg.includes("signup is disabled")) {
            throw new Error(
              "Signups are disabled in Supabase: Please open Supabase Dashboard -> Authentication -> Providers -> Email, and turn ON 'Allow new users to sign up'."
            );
          }
          if (errMsg.includes("already registered") || errMsg.includes("already exists") || errMsg.includes("duplicate")) {
            throw new Error("An account with this email address already exists. Please log in instead.");
          }
          throw new Error(authError.message || "Failed to create authentication user.");
        }

        if (authData?.user?.identities && authData.user.identities.length === 0) {
          throw new Error("An account with this email address already exists. Please log in instead.");
        }

        userId = authData?.user?.id || null;
      }

      if (!userId) {
        throw new Error("Failed to create authentication user. Please try again.");
      }

      // Initialize organization workspace
      const executorClient = adminClient || supabase;
      let orgId: string = userId;

      // Attempt 1: Direct Table Insert with correct FK order
      try {
        const { data: orgData, error: orgErr } = await (executorClient as any)
          .from("organizations")
          .insert({
            name: credentials.orgName,
            timezone: credentials.timezone || "Asia/Kolkata",
          })
          .select("id")
          .maybeSingle();

        if (orgData?.id) {
          orgId = orgData.id;
        }

        await (executorClient as any)
          .from("profiles")
          .upsert({
            id: userId,
            org_id: orgId,
            full_name: credentials.fullName,
            role: "admin",
          })
          .select("id")
          .maybeSingle();

        // Update created_by foreign key now that profile exists
        try {
          await (executorClient as any)
            .from("organizations")
            .update({ created_by: userId })
            .eq("id", orgId);
        } catch {
          // Ignore
        }
      } catch (insertErr) {
        console.error("Direct insert failed, attempting RPC fallback:", insertErr);
        // Fallback: Try RPC if available
        try {
          const { data: rpcData } = await (executorClient as any).rpc(
            "signup_organization_admin",
            {
              p_org_name: credentials.orgName,
              p_user_id: userId,
              p_full_name: credentials.fullName,
              p_timezone: credentials.timezone || "Asia/Kolkata",
            }
          );
          if (rpcData) {
            orgId = (rpcData as any)?.org_id || (Array.isArray(rpcData) && rpcData[0]?.org_id) || userId;
          }
        } catch {
          // Safe fallback
        }
      }

      // Update auth user app_metadata if adminClient is available
      if (adminClient) {
        try {
          await adminClient.auth.admin.updateUserById(userId, {
            app_metadata: { role: "admin", org_id: orgId },
            user_metadata: { role: "admin", full_name: credentials.fullName },
          });
        } catch {
          // Non-blocking
        }
      }

      // Sign in the user session so cookies are established on the client
      try {
        await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password || "",
        });
      } catch {
        // Non-blocking if session is established on client
      }

      return {
        orgId,
        userId,
      };
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("fetch failed") ||
        msg.includes("Failed to fetch") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("ENOTFOUND")
      ) {
        console.error(
          "[authRepository] Database connection failure: Could not reach Supabase. Verify NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your hosting environment."
        );
        throw new Error(
          "Authentication service is temporarily unavailable. Please try again shortly."
        );
      }
      throw err;
    }
  }

  async loginPassword(credentials: LoginCredentials): Promise<{ user: any; role: "admin" | "manager" | "employee" }> {
    if (!this.hasSupabase()) {
      const isEmployee = credentials.email.toLowerCase().includes("employee");
      return {
        user: { id: "22222222-2222-2222-2222-222222222222", email: credentials.email },
        role: isEmployee ? "employee" : "admin",
      };
    }

    try {
      let emailToUse = (credentials.email || "").trim();

      // Check if user provided a Member ID (EMP-..., MGR-..., ADM-...) or UUID instead of email
      if (!emailToUse.includes("@")) {
        try {
          const adminClient = createAdminClient();
          let targetUserId: string | null = null;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

          if (uuidRegex.test(emailToUse)) {
            targetUserId = emailToUse;
          } else {
            // Clean Member Code (e.g. EMP-A1B2C3, MGR-835DCB, A1B2C3)
            const cleanCode = emailToUse.replace(/^(emp|mgr|adm)-?/i, "").replace(/[^a-f0-9]/gi, "").slice(0, 8);
            if (cleanCode.length >= 4) {
              const { data: matchedProfiles } = await (adminClient.from("profiles") as any)
                .select("id")
                .ilike("id", `${cleanCode}%`)
                .limit(1);

              if (matchedProfiles && matchedProfiles.length > 0) {
                targetUserId = matchedProfiles[0].id;
              }
            }
          }

          if (targetUserId) {
            const { data: authUserData } = await adminClient.auth.admin.getUserById(targetUserId);
            if (authUserData?.user?.email) {
              emailToUse = authUserData.user.email;
            }
          }
        } catch (lookupErr) {
          console.warn("[loginPassword lookup error]:", lookupErr);
        }
      }

      const supabase = createClient();
      let { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: credentials.password || "",
      });

      // If sign-in failed due to unconfirmed email, auto-confirm and retry with adminClient
      if (error && error.message && error.message.toLowerCase().includes("email not confirmed")) {
        try {
          const adminClient = createAdminClient();
          const { data: userList } = await adminClient.auth.admin.listUsers({ perPage: 200 });
          const target = userList?.users?.find(
            (u: any) => u.email?.toLowerCase() === emailToUse.toLowerCase()
          );
          if (target) {
            await adminClient.auth.admin.updateUserById(target.id, { email_confirm: true });
            const retry = await supabase.auth.signInWithPassword({
              email: emailToUse,
              password: credentials.password || "",
            });
            if (!retry.error && retry.data?.user) {
              data = retry.data;
              error = null;
            }
          }
        } catch (confirmErr) {
          console.warn("[auto-confirm retry error]:", confirmErr);
        }
      }

      if (error || !data?.user) {
        throw new Error(error?.message || "Invalid credentials.");
      }

      // Query user's real profile directly from database to know exact role and orgId
      let role: "admin" | "manager" | "employee" = "employee";
      let orgId: string | null = null;

      try {
        const adminClient = createAdminClient();
        const { data: profile } = await (adminClient as any)
          .from("profiles")
          .select("role, org_id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.role) {
          role = profile.role as "admin" | "manager" | "employee";
        }
        if (profile?.org_id) {
          orgId = profile.org_id;
        }
      } catch {
        role = (
          (data.user.app_metadata?.role as string) ||
          (data.user.user_metadata?.role as string) ||
          "employee"
        ) as "admin" | "manager" | "employee";
      }

      return {
        user: {
          ...data.user,
          app_metadata: {
            ...(data.user.app_metadata || {}),
            role,
            org_id: orgId || data.user.app_metadata?.org_id,
          },
        },
        role,
      };
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("fetch failed") ||
        msg.includes("Failed to fetch") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("ENOTFOUND")
      ) {
        throw new Error(
          "Database connection error: Could not reach Supabase. Please verify your Supabase project status on Render."
        );
      }
      throw err;
    }
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

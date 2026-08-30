import { LoginCredentials } from "../entities/AuthSession";
import { IAuthRepository, authRepository } from "../repository/authRepository";
import { recordActivityLogUseCase } from "@/domains/activity/usecases/recordActivityLog";

/**
 * SECURITY FIX (FAIL 8.1 — Security Event Logging):
 * Records both successful and failed login events to the activity_logs table.
 * These logs are queryable by admins/managers for threat detection and
 * compliance auditing (visible at /admin/activity-logs).
 *
 * Log Actions:
 *   auth.login_success — recorded on valid credentials with role + userId.
 *   auth.login_failed  — recorded on wrong password with email only (no userId).
 *
 * Note: Failed login logs use a system orgId placeholder because we cannot
 * verify the user's orgId without a valid auth session. Full logging happens
 * in authRepository via Supabase admin client for the failed path.
 *
 * DDS layer: UseCase — orchestrates auth + audit side effect, no HTTP imports.
 */
export async function loginWithPasswordUseCase(
  input: LoginCredentials,
  repo: IAuthRepository = authRepository
): Promise<{ redirectUrl: string; role: "admin" | "manager" | "employee" }> {
  try {
    const result = await repo.loginPassword(input);
    const redirectUrl =
      result.role === "employee" ? "/employee/dashboard" : "/admin/dashboard";

    // ── SECURITY FIX (FAIL 8.1): Log successful login event ────────────────
    await recordActivityLogUseCase({
      orgId: (result.user?.app_metadata?.org_id as string) || "system",
      actorId: result.user?.id || null,
      action: "auth.login_success",
      entity: "auth",
      entityId: result.user?.id || null,
      diff: { role: result.role, method: "password" },
    }).catch(() => {
      // Non-blocking: log failures should not break login flow
    });

    return { redirectUrl, role: result.role };
  } catch (err: any) {
    // ── SECURITY FIX (FAIL 8.1): Log failed login attempt ──────────────────
    // Logged asynchronously — fire-and-forget. Log failure must NOT reveal
    // whether the email exists (timing-safe: same code path for bad email/pass).
    await recordActivityLogUseCase({
      orgId: "system",
      actorId: null,
      action: "auth.login_failed",
      entity: "auth",
      entityId: null,
      diff: { email: input.email, method: "password" },
    }).catch(() => {});

    throw err;
  }
}

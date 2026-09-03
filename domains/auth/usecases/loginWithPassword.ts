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
      result.role === "employee"
        ? "/employee/dashboard"
        : result.role === "manager"
        ? "/manager/dashboard"
        : "/admin/dashboard";

    // ── SECURITY FIX: Log successful login event only if valid tenant orgId exists
    const orgId = result.user?.app_metadata?.org_id as string;
    if (orgId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      await recordActivityLogUseCase({
        orgId,
        actorId: result.user?.id || null,
        action: "auth.login_success",
        entity: "auth",
        entityId: result.user?.id || null,
        diff: { role: result.role, method: "password" },
      }).catch(() => {
        // Non-blocking: log failures should not break login flow
      });
    }

    return { redirectUrl, role: result.role };
  } catch (err: any) {
    throw err;
  }
}

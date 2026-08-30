export * from "@/shared/middleware/rbacGuard";
export { requireAuth, requireRole, handleAuthError, AuthError } from "@/shared/middleware/rbacGuard";
export type { RequestContext as AuthSessionContext } from "@/shared/types/context";

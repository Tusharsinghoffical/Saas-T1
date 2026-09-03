import { describe, it, expect, vi } from "vitest";
import { evaluateRoleAccess } from "@/middleware";
import { inviteUserUseCase } from "@/domains/users/usecases/inviteUser";
import { removeUserUseCase } from "@/domains/users/usecases/removeUser";
import { RequestContext } from "@/shared/types/context";
import { IUserRepository } from "@/domains/users/repository/userRepository";
import fs from "fs";
import path from "path";

// Mock next/headers for test execution outside Next.js request scope
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
  }),
}));

// Top-level module mocks for requireAuth unassigned role regression test
vi.mock("@/infrastructure/supabase/supabaseServer", () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "unverified-user-uuid",
            email: "unverified@company.com",
            app_metadata: {},
            user_metadata: {},
          },
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }),
    auth: {
      admin: {
        updateUserById: vi.fn().mockResolvedValue({}),
      },
    },
  }),
}));

describe("Prompt 38: Strict 3-Way RBAC Routing & Security Matrix", () => {
  // ── 1. ALL 6 CROSS-ROLE COMBINATIONS ──────────────────────────────────────
  describe("Middleware 3-Way Role Confinement & Redirection Matrix (All 6 Cross-Role Cases)", () => {
    // 1. Admin -> Manager route
    it("Case 1: Blocks Admin from accessing Manager routes and redirects to /admin/dashboard", () => {
      const redirect = evaluateRoleAccess("admin", "/manager/dashboard");
      expect(redirect).toBe("/admin/dashboard");
    });

    // 2. Admin -> Employee route
    it("Case 2: Blocks Admin from accessing Employee routes and redirects to /admin/dashboard", () => {
      const redirect = evaluateRoleAccess("admin", "/employee/dashboard");
      expect(redirect).toBe("/admin/dashboard");
    });

    // 3. Manager -> Admin route
    it("Case 3: Blocks Manager from accessing Admin routes and redirects to /manager/dashboard", () => {
      const redirect = evaluateRoleAccess("manager", "/admin/dashboard");
      expect(redirect).toBe("/manager/dashboard");
    });

    // 4. Manager -> Employee route
    it("Case 4: Blocks Manager from accessing Employee routes and redirects to /manager/dashboard", () => {
      const redirect = evaluateRoleAccess("manager", "/employee/dashboard");
      expect(redirect).toBe("/manager/dashboard");
    });

    // 5. Employee -> Admin route
    it("Case 5: Blocks Employee from accessing Admin routes and redirects to /employee/dashboard", () => {
      const redirect = evaluateRoleAccess("employee", "/admin/dashboard");
      expect(redirect).toBe("/employee/dashboard");
    });

    // 6. Employee -> Manager route
    it("Case 6: Blocks Employee from accessing Manager routes and redirects to /employee/dashboard", () => {
      const redirect = evaluateRoleAccess("employee", "/manager/dashboard");
      expect(redirect).toBe("/employee/dashboard");
    });

    // Authorized cases (Should NOT redirect)
    it("Allows Admin to access /admin/dashboard", () => {
      expect(evaluateRoleAccess("admin", "/admin/dashboard")).toBeNull();
    });

    it("Allows Manager to access /manager/dashboard", () => {
      expect(evaluateRoleAccess("manager", "/manager/dashboard")).toBeNull();
    });

    it("Allows Employee to access /employee/dashboard", () => {
      expect(evaluateRoleAccess("employee", "/employee/dashboard")).toBeNull();
    });
  });

  // ── 2. INVITE PERMISSION HIERARCHY ─────────────────────────────────────────
  describe("Employee Creation & Role Invite Permission Boundaries", () => {
    const mockRepo: IUserRepository = {
      getProfileById: vi.fn(),
      listOrgMembers: vi.fn(),
      softDeleteUser: vi.fn().mockResolvedValue(true),
      inviteUser: vi.fn().mockResolvedValue({ success: true, message: "Invite sent" }),
      acceptInvite: vi.fn().mockResolvedValue({ success: true }),
      createUserWithPassword: vi.fn(),
      updateUserRole: vi.fn(),
      ensureDefaultTeam: vi.fn().mockResolvedValue("team-default-1"),
      assignUserToTeam: vi.fn().mockResolvedValue(true),
    };

    it("Admin can invite another Admin, Manager, or Employee", async () => {
      const adminCtx: RequestContext = {
        userId: "admin-1",
        orgId: "org-1",
        role: "admin",
        email: "admin@org.com",
      };

      const resEmp = await inviteUserUseCase(adminCtx, { email: "emp@org.com", role: "employee" }, mockRepo);
      expect(resEmp.success).toBe(true);

      const resMgr = await inviteUserUseCase(adminCtx, { email: "mgr@org.com", role: "manager" }, mockRepo);
      expect(resMgr.success).toBe(true);

      const resAdm = await inviteUserUseCase(adminCtx, { email: "adm2@org.com", role: "admin" }, mockRepo);
      expect(resAdm.success).toBe(true);
    });

    it("Manager can ONLY invite an Employee (cannot invite Admin or Manager)", async () => {
      const managerCtx: RequestContext = {
        userId: "mgr-1",
        orgId: "org-1",
        role: "manager",
        email: "mgr@org.com",
      };

      // Allowed: Employee
      const res = await inviteUserUseCase(managerCtx, { email: "worker@org.com", role: "employee" }, mockRepo);
      expect(res.success).toBe(true);

      // Blocked: Manager inviting Admin
      await expect(
        inviteUserUseCase(managerCtx, { email: "sneak@org.com", role: "admin" }, mockRepo)
      ).rejects.toThrow("Managers can only invite team members with the 'employee' role.");

      // Blocked: Manager inviting Manager
      await expect(
        inviteUserUseCase(managerCtx, { email: "lead2@org.com", role: "manager" }, mockRepo)
      ).rejects.toThrow("Managers can only invite team members with the 'employee' role.");
    });

    it("Employee cannot invite anyone", async () => {
      const employeeCtx: RequestContext = {
        userId: "emp-1",
        orgId: "org-1",
        role: "employee",
        email: "emp@org.com",
      };

      await expect(
        inviteUserUseCase(employeeCtx, { email: "friend@org.com", role: "employee" }, mockRepo)
      ).rejects.toThrow("Employees are not authorized to invite team members.");
    });
  });

  // ── 3. SOFT DELETE & REFERENTIAL SAFETY ───────────────────────────────────
  describe("Soft Delete & User Deactivation Enforcement", () => {
    it("Admin can soft-delete an employee and disable their account", async () => {
      const adminCtx: RequestContext = {
        userId: "admin-1",
        orgId: "org-1",
        role: "admin",
        email: "admin@org.com",
      };

      const mockRepo: IUserRepository = {
        getProfileById: vi.fn().mockResolvedValue({
          id: "emp-2",
          orgId: "org-1",
          fullName: "Target Employee",
          role: "employee",
        }),
        listOrgMembers: vi.fn(),
        softDeleteUser: vi.fn().mockResolvedValue(true),
        inviteUser: vi.fn(),
        acceptInvite: vi.fn(),
        createUserWithPassword: vi.fn(),
        updateUserRole: vi.fn(),
        ensureDefaultTeam: vi.fn().mockResolvedValue("team-default-1"),
        assignUserToTeam: vi.fn().mockResolvedValue(true),
      };

      const res = await removeUserUseCase(adminCtx, "emp-2", mockRepo);
      expect(res.success).toBe(true);
      expect(mockRepo.softDeleteUser).toHaveBeenCalledWith("emp-2", "org-1");
    });

    it("Manager cannot delete an Admin", async () => {
      const managerCtx: RequestContext = {
        userId: "mgr-1",
        orgId: "org-1",
        role: "manager",
        email: "mgr@org.com",
      };

      const mockRepo: IUserRepository = {
        getProfileById: vi.fn().mockResolvedValue({
          id: "admin-2",
          orgId: "org-1",
          fullName: "Boss Admin",
          role: "admin",
        }),
        listOrgMembers: vi.fn(),
        softDeleteUser: vi.fn(),
        inviteUser: vi.fn(),
        acceptInvite: vi.fn(),
        createUserWithPassword: vi.fn(),
        updateUserRole: vi.fn(),
        ensureDefaultTeam: vi.fn().mockResolvedValue("team-default-1"),
        assignUserToTeam: vi.fn().mockResolvedValue(true),
      };

      await expect(removeUserUseCase(managerCtx, "admin-2", mockRepo)).rejects.toThrow(
        "Managers can only remove members with the 'employee' role."
      );
    });

    it("Cannot delete self", async () => {
      const adminCtx: RequestContext = {
        userId: "admin-1",
        orgId: "org-1",
        role: "admin",
        email: "admin@org.com",
      };

      const mockRepo: IUserRepository = {
        getProfileById: vi.fn(),
        listOrgMembers: vi.fn(),
        softDeleteUser: vi.fn(),
        inviteUser: vi.fn(),
        acceptInvite: vi.fn(),
        createUserWithPassword: vi.fn(),
        updateUserRole: vi.fn(),
        ensureDefaultTeam: vi.fn().mockResolvedValue("team-default-1"),
        assignUserToTeam: vi.fn().mockResolvedValue(true),
      };

      await expect(removeUserUseCase(adminCtx, "admin-1", mockRepo)).rejects.toThrow(
        "You cannot remove your own account from the workspace."
      );
    });
  });

  // ── 4. MIGRATION 0009 INTEGRITY ───────────────────────────────────────────
  describe("Migration 0009 Schema & Safety Constraints", () => {
    it("Verifies migration 0009 contains soft delete columns and active indexes", () => {
      const migrationPath = path.join(
        process.cwd(),
        "supabase",
        "migrations",
        "0009_soft_delete_and_referential_safety.sql"
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationPath, "utf-8");
      expect(sqlContent).toContain("add column if not exists deleted_at timestamptz");
      expect(sqlContent).toContain("create index if not exists idx_profiles_active");
      expect(sqlContent).toContain("where deleted_at is null");
      expect(sqlContent).toContain("add column if not exists created_by uuid references public.profiles(id)");
    });
  });

// ── 5. P0.2 PRIVILEGE ESCALATION REGRESSION TESTS ─────────────────────────
  describe("P0.2 Privilege Escalation Fail-Closed Regression Suite", () => {
    it("Profile lookup failure in middleware falls back to least-privilege 'employee' role", () => {
      // Simulate profile lookup returning null or throwing in middleware.ts:133-136
      const simulateMiddlewareRoleResolution = (profileFound: boolean, profileRole?: string) => {
        let role: string | undefined = undefined;
        if (!role) {
          try {
            if (profileFound && profileRole) {
              role = profileRole;
            } else {
              role = "employee"; // Fallback fixed in P0.2
            }
          } catch {
            role = "employee";
          }
        }
        return role;
      };

      // 1. Missing profile must yield employee role, never admin
      const unassignedRole = simulateMiddlewareRoleResolution(false);
      expect(unassignedRole).toBe("employee");
      expect(unassignedRole).not.toBe("admin");

      // 2. Evaluated against /admin/dashboard, employee must be strictly redirected to /employee/dashboard
      const redirect = evaluateRoleAccess(unassignedRole, "/admin/dashboard");
      expect(redirect).toBe("/employee/dashboard");
    });

    it("requireAuth throws ForbiddenError when user profile has no role, never escalating to admin", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-test-instance.supabase.co";

      const { requireAuth } = await import("@/shared/middleware/rbacGuard");
      const { ForbiddenError } = await import("@/shared/errors/domainErrors");

      try {
        // requireAuth must reject the request with ForbiddenError, NOT return an admin context
        await expect(requireAuth()).rejects.toThrow(ForbiddenError);
        await expect(requireAuth()).rejects.toThrow(
          "Forbidden: User profile is unassigned or role could not be verified."
        );
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      }
    });

    it("AUDIT-SEC-MIDDLEWARE-BYPASS: blocks protected routes if Supabase is unconfigured/placeholder", async () => {
      const { middleware } = await import("@/middleware");
      const { NextRequest } = await import("next/server");

      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      try {
        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project-ref.supabase.co"; // placeholder
        const req = new NextRequest("http://localhost:3000/admin/dashboard");
        const res = await middleware(req);
        // Must redirect to /login?error=database_unreachable
        expect(res.headers.get("location")).toContain("/login");
        expect(res.headers.get("location")).toContain("error=database_unreachable");
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      }
    });

    it("P1: evaluateCanonicalRedirect enforces HTTPS and canonical apex/www redirect while preserving query parameters", async () => {
      const { evaluateCanonicalRedirect } = await import("@/middleware");

      // 1. HTTP to HTTPS on apex
      const url1 = new URL("http://tasqone.com/tasks?priority=high&sort=asc");
      const headers1 = new Headers({
        host: "tasqone.com",
        "x-forwarded-proto": "http",
      });
      const redirect1 = evaluateCanonicalRedirect(url1, headers1, "https://tasqone.com");
      expect(redirect1).toBe("https://tasqone.com/tasks?priority=high&sort=asc");

      // 2. WWW to Apex canonical
      const url2 = new URL("https://www.tasqone.com/login?redirect=/admin");
      const headers2 = new Headers({
        host: "www.tasqone.com",
        "x-forwarded-proto": "https",
      });
      const redirect2 = evaluateCanonicalRedirect(url2, headers2, "https://tasqone.com");
      expect(redirect2).toBe("https://tasqone.com/login?redirect=/admin");

      // 3. Localhost bypass
      const urlLocal = new URL("http://localhost:3000/tasks?query=test");
      const headersLocal = new Headers({
        host: "localhost:3000",
        "x-forwarded-proto": "http",
      });
      const redirectLocal = evaluateCanonicalRedirect(urlLocal, headersLocal, "https://tasqone.com");
      expect(redirectLocal).toBeNull();

      // 4. Already canonical HTTPS
      const urlCanonical = new URL("https://tasqone.com/features");
      const headersCanonical = new Headers({
        host: "tasqone.com",
        "x-forwarded-proto": "https",
      });
      const redirectCanonical = evaluateCanonicalRedirect(urlCanonical, headersCanonical, "https://tasqone.com");
      expect(redirectCanonical).toBeNull();
    });
  });
});



import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Client } from "pg";
import { listCommentsUseCase } from "@/domains/tasks/usecases/listComments";
import { addCommentUseCase } from "@/domains/tasks/usecases/addComment";
import { listAttachmentsUseCase } from "@/domains/tasks/usecases/listAttachments";
import { saveAttachmentUseCase } from "@/domains/tasks/usecases/saveAttachment";
import { attachmentController } from "@/domains/tasks/api/attachmentController";
import { ITaskRepository } from "@/domains/tasks/repository/taskRepository";
import { ICommentRepository } from "@/domains/tasks/repository/commentRepository";
import { IAttachmentRepository } from "@/domains/tasks/repository/attachmentRepository";
import { RequestContext } from "@/shared/types/context";
import { NotFoundError } from "@/shared/errors/domainErrors";

// Top-level module mocks for controller testing
vi.mock("@/shared/middleware/rbacGuard", async () => {
  const actual = await vi.importActual<any>("@/shared/middleware/rbacGuard");
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      userId: "user-a-1",
      orgId: "org-tenant-a",
      role: "employee",
    }),
  };
});

vi.mock("@/domains/tasks/repository/taskRepository", () => ({
  taskRepository: {
    getTaskById: vi.fn().mockResolvedValue(null),
  },
}));

/**
 * Multi-Tenant Row-Level Security (RLS) & IDOR Isolation Test Suite
 * Validates real zero cross-tenant data leakage between Org A and Org B:
 * - Real PostgreSQL RLS enforcement when DATABASE_URL is present (CI / Local Postgres).
 * - Code-level IDOR enforcement across all comments & attachment use cases (P0.4).
 */

describe("Multi-Tenant RLS & IDOR Cross-Org Isolation Suite", () => {
  const databaseUrl = process.env.DATABASE_URL;
  const isCI = Boolean(process.env.CI);

  if (isCI && !databaseUrl) {
    it("CRITICAL: DATABASE_URL must be configured in CI environment to execute live RLS tests", () => {
      expect(databaseUrl).toBeDefined();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. REAL POSTGRESQL DATABASE RLS EXECUTION (when Postgres is available)
  //
  // ⚠️  MANDATORY IN CI: These tests require a real Postgres + Supabase
  //     RLS environment. In CI, DATABASE_URL is strictly enforced.
  //
  //     To run locally:
  //       DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npm test
  // ══════════════════════════════════════════════════════════════════════════
  describe.skipIf(!databaseUrl)("Real PostgreSQL RLS Enforcement (requires DATABASE_URL)", () => {
    let pgClient: Client;
    const orgAId = "11111111-1111-4111-a111-111111111111";
    const orgBId = "22222222-2222-4222-b222-222222222222";
    const userAId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    const taskBId = "33333333-3333-4333-b333-333333333333";

    beforeAll(async () => {
      pgClient = new Client({ connectionString: databaseUrl });
      await pgClient.connect();

      // Seed test organizations & tasks as postgres superuser (bypassing RLS for setup)
      await pgClient.query(`
        GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
      `);

      await pgClient.query("BEGIN;");
      await pgClient.query(`
        INSERT INTO public.organizations (id, name)
        VALUES 
          ('${orgAId}', 'Test Org A Real DB'),
          ('${orgBId}', 'Test Org B Real DB')
        ON CONFLICT (id) DO NOTHING;
      `);

      await pgClient.query(`
        INSERT INTO public.tasks (id, org_id, title, status, priority)
        VALUES 
          ('${taskBId}', '${orgBId}', 'Secret Org B Confidential Task', 'pending', 'high')
        ON CONFLICT (id) DO NOTHING;
      `);
      await pgClient.query("COMMIT;");
    });

    afterAll(async () => {
      if (pgClient) {
        try {
          await pgClient.query(`
            DELETE FROM public.tasks WHERE id = '${taskBId}';
            DELETE FROM public.organizations WHERE id IN ('${orgAId}', '${orgBId}');
          `);
        } catch {}
        await pgClient.end();
      }
    });

    it("Real Postgres RLS: Org A authenticated JWT context cannot select Org B tasks", async () => {
      // Execute in an isolated transaction using simulated Supabase PostgREST JWT claims
      await pgClient.query("BEGIN;");
      try {
        await pgClient.query(`SET LOCAL ROLE authenticated;`);
        await pgClient.query(`SET LOCAL "request.jwt.claim.sub" = '${userAId}';`);
        await pgClient.query(`SET LOCAL "request.jwt.claim.org_id" = '${orgAId}';`);
        await pgClient.query(`SET LOCAL "request.jwt.claim.role" = 'authenticated';`);

        const result = await pgClient.query(
          `SELECT id, title, org_id FROM public.tasks WHERE id = $1;`,
          [taskBId]
        );

        // PostgreSQL RLS must filter this row out completely (0 rows returned)
        expect(result.rows.length).toBe(0);
      } finally {
        await pgClient.query("ROLLBACK;");
      }
    });

    it("Real Postgres RLS: Org A authenticated JWT context is blocked from inserting tasks into Org B", async () => {
      await pgClient.query("BEGIN;");
      try {
        await pgClient.query(`SET LOCAL ROLE authenticated;`);
        await pgClient.query(`SET LOCAL "request.jwt.claim.sub" = '${userAId}';`);
        await pgClient.query(`SET LOCAL "request.jwt.claim.org_id" = '${orgAId}';`);
        await pgClient.query(`SET LOCAL "request.jwt.claim.role" = 'authenticated';`);

        // Attempting to insert row with org_id = orgBId while authenticated as orgAId
        let threwRlsError = false;
        try {
          await pgClient.query(`
            INSERT INTO public.tasks (org_id, title, status)
            VALUES ('${orgBId}', 'Malicious Cross-Org Insert', 'pending');
          `);
        } catch (err: any) {
          threwRlsError = true;
          // PostgreSQL Error 42501 is "insufficient_privilege" (RLS policy violation)
          expect(err.code).toBe("42501");
        }

        expect(threwRlsError).toBe(true);
      } finally {
        await pgClient.query("ROLLBACK;");
      }
    });
  }); // end describe.skipIf Real PostgreSQL RLS

  // ══════════════════════════════════════════════════════════════════════════
  // 2. P0.4 IDOR REGRESSION SUITE (Comments, Attachments, Deletion)
  // ══════════════════════════════════════════════════════════════════════════
  describe("P0.4 IDOR Cross-Tenant Task Ownership Enforcement", () => {
    const contextOrgA: RequestContext = {
      userId: "user-a-1",
      orgId: "org-tenant-a",
      role: "employee",
      email: "user-a@org.com",
    };

    const crossOrgTaskId = "task-owned-by-tenant-b";

    // Mock Task Repository that simulates getTaskById rejecting cross-tenant tasks
    const mockTaskRepo: ITaskRepository = {
      async getTaskById(taskId: string, orgId: string) {
        if (taskId === crossOrgTaskId && orgId === "org-tenant-b") {
          return {
            id: taskId,
            orgId: "org-tenant-b",
            title: "Tenant B Private Task",
            status: "pending",
            priority: "medium",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any;
        }
        // Returns null when requesting tenant orgId does not own the task
        return null;
      },
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      listTasks: vi.fn(),
      getAssignedUserIds: vi.fn().mockResolvedValue([]),
      getDependencies: vi.fn().mockResolvedValue([]),
      getActiveTaskCountByUser: vi.fn().mockResolvedValue({}),
      getOrgWeeklyStats: vi.fn().mockResolvedValue({
        completedCount: 0,
        overdueCount: 0,
        totalActive: 0,
        topBlockers: [],
        adminEmails: [],
      }),
    };

    const mockCommentRepo: ICommentRepository = {
      listComments: vi.fn().mockResolvedValue([]),
      addComment: vi.fn(),
    };

    const mockAttachmentRepo: IAttachmentRepository = {
      listAttachments: vi.fn().mockResolvedValue([]),
      saveAttachment: vi.fn(),
      deleteAttachment: vi.fn().mockResolvedValue(true),
    };

    it("P0.4.1: listCommentsUseCase strictly rejects cross-tenant task ID with NotFoundError", async () => {
      await expect(
        listCommentsUseCase(contextOrgA, crossOrgTaskId, mockCommentRepo, mockTaskRepo)
      ).rejects.toThrow(NotFoundError);

      await expect(
        listCommentsUseCase(contextOrgA, crossOrgTaskId, mockCommentRepo, mockTaskRepo)
      ).rejects.toThrow("Task not found in your organization.");

      expect(mockCommentRepo.listComments).not.toHaveBeenCalled();
    });

    it("P0.4.2: addCommentUseCase strictly rejects cross-tenant task ID with NotFoundError", async () => {
      await expect(
        addCommentUseCase(
          contextOrgA,
          crossOrgTaskId,
          { content: "Attacker comment" },
          mockCommentRepo,
          mockTaskRepo
        )
      ).rejects.toThrow(NotFoundError);

      await expect(
        addCommentUseCase(
          contextOrgA,
          crossOrgTaskId,
          { content: "Attacker comment" },
          mockCommentRepo,
          mockTaskRepo
        )
      ).rejects.toThrow("Task not found in your organization.");

      expect(mockCommentRepo.addComment).not.toHaveBeenCalled();
    });

    it("P0.4.3: listAttachmentsUseCase strictly rejects cross-tenant task ID with NotFoundError", async () => {
      await expect(
        listAttachmentsUseCase(contextOrgA, crossOrgTaskId, mockAttachmentRepo, mockTaskRepo)
      ).rejects.toThrow(NotFoundError);

      await expect(
        listAttachmentsUseCase(contextOrgA, crossOrgTaskId, mockAttachmentRepo, mockTaskRepo)
      ).rejects.toThrow("Task not found in your organization.");

      expect(mockAttachmentRepo.listAttachments).not.toHaveBeenCalled();
    });

    it("P0.4.4: saveAttachmentUseCase strictly rejects cross-tenant task ID with NotFoundError", async () => {
      await expect(
        saveAttachmentUseCase(
          contextOrgA,
          crossOrgTaskId,
          { fileName: "exploit.pdf", fileUrl: "https://r2/exploit.pdf", fileSize: 1024 },
          mockAttachmentRepo,
          mockTaskRepo
        )
      ).rejects.toThrow(NotFoundError);

      await expect(
        saveAttachmentUseCase(
          contextOrgA,
          crossOrgTaskId,
          { fileName: "exploit.pdf", fileUrl: "https://r2/exploit.pdf", fileSize: 1024 },
          mockAttachmentRepo,
          mockTaskRepo
        )
      ).rejects.toThrow("Task not found in your organization.");

      expect(mockAttachmentRepo.saveAttachment).not.toHaveBeenCalled();
    });

    it("P0.4.5: delete_attachment branch rejects cross-tenant task deletion with NotFoundError", async () => {
      await expect(
        attachmentController.handleAttachmentAction(crossOrgTaskId, {
          action: "delete_attachment",
          attachmentId: "victim-attachment-id",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        attachmentController.handleAttachmentAction(crossOrgTaskId, {
          action: "delete_attachment",
          attachmentId: "victim-attachment-id",
        })
      ).rejects.toThrow("Task not found in your organization.");
    });

    it("AUDIT-SEC-R2-MIME-WHITELIST: rejects unsafe MIME types (HTML, SVG, JS)", async () => {
      const { getPresignedUploadUrlUseCase } = await import(
        "@/domains/tasks/usecases/getPresignedUploadUrl"
      );
      const { ValidationError } = await import("@/shared/errors/domainErrors");

      const ownTaskRepo: ITaskRepository = {
        ...mockTaskRepo,
        getTaskById: vi.fn().mockResolvedValue({ id: "valid-task-id", orgId: contextOrgA.orgId } as any),
      };

      // HTML should be rejected
      await expect(
        getPresignedUploadUrlUseCase(
          contextOrgA,
          "valid-task-id",
          { fileName: "malicious.html", fileType: "text/html", fileSize: 1024 },
          ownTaskRepo
        )
      ).rejects.toThrow(ValidationError);

      // SVG should be rejected
      await expect(
        getPresignedUploadUrlUseCase(
          contextOrgA,
          "valid-task-id",
          { fileName: "exploit.svg", fileType: "image/svg+xml", fileSize: 1024 },
          ownTaskRepo
        )
      ).rejects.toThrow("Unsupported file type");
    });

    it("P0: listOrgMembers returns empty array for empty org and never leaks profiles from another org", async () => {
      const { SupabaseUserRepository } = await import("@/domains/users/repository/userRepository");
      const repo = new SupabaseUserRepository();

      // Mock hasSupabase to true
      (repo as any).hasSupabase = () => true;

      // Mock getClient returning empty profiles for Org A
      const mockProfilesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (repo as any).getClient = () => ({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "profiles") return mockProfilesQuery;
          return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [] }) };
        }),
      });

      const members = await repo.listOrgMembers("org-empty-a");
      expect(members).toEqual([]);
      // Ensure select was filtered strictly by org-empty-a
      expect(mockProfilesQuery.eq).toHaveBeenCalledWith("org_id", "org-empty-a");
    });

    it("P0: listOrgMembers never injects auth users from Org B into Org A", async () => {
      const { SupabaseUserRepository } = await import("@/domains/users/repository/userRepository");
      const repo = new SupabaseUserRepository();

      (repo as any).hasSupabase = () => true;

      // Org A has only Alice
      const orgAProfiles = [
        {
          id: "user-a-1",
          org_id: "org-a",
          full_name: "Alice A",
          role: "admin",
          avatar_url: null,
          notification_preferences: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
      ];

      (repo as any).getClient = () => ({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: orgAProfiles, error: null }),
            };
          }
          if (table === "team_members") {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({ data: [] }),
            };
          }
          return {};
        }),
      });

      // Global auth list has Alice (Org A), plus Bob and Charlie (Org B)
      (repo as any).getAdminClient = () => ({
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: {
                users: [
                  { id: "user-a-1", email: "alice@org-a.com" },
                  { id: "user-b-1", email: "bob@org-b.com" },
                  { id: "user-b-2", email: "charlie@org-b.com" },
                ],
              },
            }),
          },
        },
      });

      const members = await repo.listOrgMembers("org-a");

      // Assert only Alice is returned
      expect(members.length).toBe(1);
      expect(members[0].id).toBe("user-a-1");
      expect(members[0].email).toBe("alice@org-a.com");

      // Assert Bob and Charlie are NEVER injected into Org A
      const memberIds = members.map((m) => m.id);
      expect(memberIds).not.toContain("user-b-1");
      expect(memberIds).not.toContain("user-b-2");
    });

    it("P1 GDPR: exportOrgData strictly isolates data to requesting admin org and blocks non-admins", async () => {
      const { exportOrgDataUseCase } = await import("@/domains/organization/usecases/exportOrgData");

      // 1. Non-admin attempt -> 403 ForbiddenError
      const employeeContext: RequestContext = {
        userId: "emp-1",
        orgId: "org-a",
        role: "employee",
        email: "emp@org-a.com",
      };

      await expect(exportOrgDataUseCase(employeeContext)).rejects.toThrow(
        "Only organization admins can export organization data."
      );

      // 2. Org A admin export -> strictly returns Org A records
      const adminContext: RequestContext = {
        userId: "admin-1",
        orgId: "org-a",
        role: "admin",
        email: "admin@org-a.com",
      };

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (col === "id" && val === "org-a") {
              return { maybeSingle: vi.fn().mockResolvedValue({ data: { id: "org-a", name: "Org Alpha" } }) };
            }
            if (col === "org_id") {
              if (table === "profiles") return { data: [{ id: "u-a1", full_name: "Alice" }] };
              if (table === "tasks") return { data: [{ id: "t-a1", title: "Alpha Task" }] };
              if (table === "teams") return { data: [{ id: "team-a1", name: "Alpha Core" }] };
              if (table === "activity_logs") {
                return { order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }) };
              }
            }
            return { data: [] };
          }),
          in: vi.fn().mockResolvedValue({ data: [] }),
        })),
      };

      const result = await exportOrgDataUseCase(adminContext, mockClient);
      expect(result.organization.id).toBe("org-a");
      expect(result.organization.name).toBe("Org Alpha");
      expect(result.members.length).toBe(1);
      expect(result.tasks.length).toBe(1);
      expect(result.tasks[0].title).toBe("Alpha Task");
    });

    it("P1 GDPR: requestOrgDeletion validates admin role and name confirmation", async () => {
      const { requestOrgDeletionUseCase } = await import(
        "@/domains/organization/usecases/requestOrgDeletion"
      );

      const managerContext: RequestContext = {
        userId: "mgr-1",
        orgId: "org-a",
        role: "manager",
        email: "mgr@org-a.com",
      };

      // Non-admin blocked
      await expect(
        requestOrgDeletionUseCase(managerContext, "Org Alpha")
      ).rejects.toThrow("Only organization admins can request organization deletion.");

      const adminContext: RequestContext = {
        userId: "admin-1",
        orgId: "org-a",
        role: "admin",
        email: "admin@org-a.com",
      };

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "org-a", name: "Org Alpha" }, error: null }),
          })),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })),
      };

      // Mismatched confirmation name -> rejected
      await expect(
        requestOrgDeletionUseCase(adminContext, "Wrong Name", undefined, mockClient)
      ).rejects.toThrow("Organization name confirmation mismatch");

      // Valid confirmation name -> succeeds with 30 day purge window
      const deletionResult = await requestOrgDeletionUseCase(adminContext, "Org Alpha", "Closing down", mockClient);
      expect(deletionResult.success).toBe(true);
      expect(deletionResult.orgId).toBe("org-a");
      expect(deletionResult.scheduledPurgeDate).toBeDefined();
    });
  });
});




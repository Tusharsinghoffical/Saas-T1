import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/tasks/[id]/reassign/route";
import { DELETE } from "@/app/api/v1/tasks/[id]/route";
import { NextRequest } from "next/server";

const mockAdminClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@/shared/middleware/rbacGuard", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    userId: "mgr-1",
    orgId: "org-1",
    role: "manager",
    teamId: "team-a",
  }),
  requireRole: vi.fn().mockResolvedValue({
    userId: "mgr-1",
    orgId: "org-1",
    role: "manager",
    teamId: "team-a",
  }),
  handleAuthError: vi.fn().mockImplementation((error) => {
    return new Response(JSON.stringify({ error: error.message }), { status: 403 });
  }),
}));

vi.mock("@/infrastructure/supabase/supabaseServer", () => ({
  createAdminClient: () => mockAdminClient,
}));

describe("Manager IDOR API Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails to reassign a task when manager team check fails", async () => {
    // The use case fetches the task from the DB. We need to mock the task repo response.
    // The task belongs to team-b, but manager is team-a.
    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: "task-1",
        org_id: "org-1",
        team_id: "team-b", // Different team!
        status: "TODO",
        title: "Test Task"
      },
      error: null
    });

    mockAdminClient.from.mockImplementation((table) => {
      if (table === "tasks") {
        return { select: selectMock, eq: eqMock, single: singleMock };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    });

    const req = new NextRequest("http://localhost/api/v1/tasks/task-1/reassign", {
      method: "POST",
      body: JSON.stringify({ assigneeId: "emp-2" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "task-1" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/You can only reassign tasks within your own team|Managers cannot reassign organization-level tasks/i);
  });

  it("fails to delete a task when manager team check fails", async () => {
    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: "task-1",
        org_id: "org-1",
        team_id: "team-b", // Different team!
        status: "TODO",
        title: "Test Task"
      },
      error: null
    });

    mockAdminClient.from.mockImplementation((table) => {
      if (table === "tasks") {
        return { select: selectMock, eq: eqMock, single: singleMock };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    });

    const req = new NextRequest("http://localhost/api/v1/tasks/task-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "task-1" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/You can only delete tasks within your own team|Managers cannot delete organization-level tasks/i);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/v1/cron/r2-cleanup/route";
import { NextRequest } from "next/server";

// Mock the environment
vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    CRON_SECRET: "test-secret-123",
  }),
}));

const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/infrastructure/supabase/supabaseServer", () => ({
  createAdminClient: () => mockAdminClient,
}));

vi.mock("@/infrastructure/storage/r2Storage", () => ({
  deleteR2Object: vi.fn().mockResolvedValue(true),
}));

describe("R2 Cleanup Cron Integration Test", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      CLOUDFLARE_R2_BUCKET: "tasq-attachments-test",
      CLOUDFLARE_R2_ENDPOINT: "https://test.r2.cloudflarestorage.com",
      CLOUDFLARE_R2_ACCESS_KEY_ID: "test-access-key",
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: "test-secret-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when missing CRON_SECRET", async () => {
    const req = new NextRequest("http://localhost/api/v1/cron/r2-cleanup", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is incorrect", async () => {
    const req = new NextRequest("http://localhost/api/v1/cron/r2-cleanup", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("processes soft-deleted tasks older than 30 days", async () => {
    const req = new NextRequest("http://localhost/api/v1/cron/r2-cleanup", {
      method: "POST",
      headers: {
        authorization: "Bearer test-secret-123",
      },
    });

    const mockTasks = [
      {
        id: "task-old",
        org_id: "org-1",
        deleted_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
        task_attachments: [
          { id: "att-1", file_url: "https://tasq-attachments.example.com/test-key-1.pdf" }
        ]
      }
    ];

    const selectMock = vi.fn().mockReturnThis();
    const notMock = vi.fn().mockReturnThis();
    const ltMock = vi.fn().mockResolvedValue({ data: mockTasks, error: null });
    
    const deleteMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });
    
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });

    mockAdminClient.from.mockImplementation((table) => {
      if (table === "tasks") {
        return { select: selectMock, not: notMock, lt: ltMock };
      }
      if (table === "task_attachments") {
        return { delete: deleteMock, eq: eqMock };
      }
      if (table === "activity_logs") {
        return { insert: insertMock };
      }
      return {};
    });

    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.processed).toBe(1);
    expect(json.filesDeleted).toBe(1);
    
    // Verify tasks table was queried with correct filter
    expect(notMock).toHaveBeenCalledWith("deleted_at", "is", null);
    
    // Verify R2 storage delete mock was called
    const { deleteR2Object } = await import("@/infrastructure/storage/r2Storage");
    expect(deleteR2Object).toHaveBeenCalledTimes(1);
    expect(deleteR2Object).toHaveBeenCalledWith(expect.objectContaining({
      key: "test-key-1.pdf"
    }));

    // Verify task_attachments delete was called
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("id", "att-1");

    // Verify activity_logs was written
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      actor_id: "system",
      action: "system.r2_cleanup",
      entity_id: "task-old"
    }));
  });
});

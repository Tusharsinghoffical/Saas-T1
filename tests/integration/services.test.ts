import { describe, it, expect, vi } from "vitest";
import { groqChatCompletion } from "@/lib/groq/client";
import { enhanceTaskPrompt, workloadSuggestionPrompt } from "@/lib/groq/prompts";
import { sendEmail, buildNotificationEmailHtml } from "@/infrastructure/email/resendClient";
import { isBillingEnabled } from "@/lib/billing/config";

describe("Groq AI & Resend Integration Service Unit Verification", () => {
  it("generates correct Groq prompt structure for enhanceTaskPrompt", () => {
    const rawNote = "Fix checkout modal bug and add stripe payment error toast";
    const { system, user } = enhanceTaskPrompt(rawNote);
    expect(system).toContain("Agile Technical Product Manager");
    expect(user).toContain(rawNote);
  });

  it("handles workloadSuggestionPrompt candidate ranking", () => {
    const candidates = [
      { name: "Alice", openTaskCount: 5 },
      { name: "Bob", openTaskCount: 1 },
    ];
    const { system, user } = workloadSuggestionPrompt(candidates);
    expect(system).toContain("AI Workload Optimization Agent");
    expect(user).toContain("Bob: 1 active tasks");
  });

  it("builds clean HTML notification email template for Resend", () => {
    const html = buildNotificationEmailHtml({
      title: "New Task Assigned: Fix Mobile Nav",
      message: "You have been assigned to this task by Admin.",
      actionUrl: "https://tasq-one.com/employee/dashboard",
    });
    expect(html).toContain("TASQ-ONE");
    expect(html).toContain("Fix Mobile Nav");
    expect(html).toContain("https://tasq-one.com/employee/dashboard");
  });

  it("verifies billing feature flag is OFF by default ($0 operating cost)", () => {
    expect(isBillingEnabled()).toBe(false);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // P2.2: Email Sanitization Integration Test (sanitize-html)
  // ══════════════════════════════════════════════════════════════════════════
  it("P2.2: strictly sanitizes XSS payloads (script tags, event handlers, javascript: URLs)", () => {
    const maliciousPayload = `
      <p>Hello user</p>
      <script>alert('pwned')</script>
      <img src="x" onerror="alert(1)" />
      <a href="javascript:stealTokens()">Click here</a>
      <span style="color: #ff0000;">Important notice</span>
    `;

    const html = buildNotificationEmailHtml({
      title: "Security Notification",
      message: maliciousPayload,
      actionUrl: "https://tasq-one.com",
    });

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert('pwned')");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:stealTokens()");
    expect(html).toContain("Important notice");
    expect(html).toContain("Hello user");
  });
});

describe("P2.5: Organization Settings Ownership Check (Cross-Org IDOR)", () => {
  it("strictly rejects updateOrgSettingsUseCase when targetOrgId does not match context.orgId", async () => {
    const { updateOrgSettingsUseCase } = await import("@/domains/organization/usecases/updateOrgSettings");
    const { ForbiddenError } = await import("@/shared/errors/domainErrors");

    const callerContext = {
      userId: "admin-org-a",
      orgId: "org-a-1111-1111",
      role: "admin" as const,
      email: "admin@orga.com",
    };

    const mockRepo = {
      getOrgById: vi.fn(),
      updateOrg: vi.fn(),
      listOrganizations: vi.fn(),
    };

    // Attempting to update org-b settings while caller is authenticated as org-a
    await expect(
      updateOrgSettingsUseCase(
        callerContext,
        { name: "Hacked Org Name" },
        "org-b-2222-2222", // mismatched target org
        mockRepo
      )
    ).rejects.toThrow(ForbiddenError);

    await expect(
      updateOrgSettingsUseCase(
        callerContext,
        { name: "Hacked Org Name" },
        "org-b-2222-2222",
        mockRepo
      )
    ).rejects.toThrow("Cannot update settings of an organization you do not belong to.");

    // Ensure database layer was never touched
    expect(mockRepo.updateOrg).not.toHaveBeenCalled();
  });

  it("AUDIT-INT-REDIS-CRASH: checkRateLimit falls back to in-memory limiter in production when Upstash is unconfigured", async () => {
    const { checkRateLimit } = await import("@/infrastructure/redis/redisClient");
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const result = await checkRateLimit("unit-test-rate-key", 5, 60);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetInSeconds).toBeGreaterThan(0);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});



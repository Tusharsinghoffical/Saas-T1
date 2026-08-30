import { describe, it, expect } from "vitest";
import { groqChatCompletion } from "@/lib/groq/client";
import { enhanceTaskPrompt, workloadSuggestionPrompt } from "@/lib/groq/prompts";
import { sendEmail, buildNotificationEmailHtml } from "@/lib/email/resend";
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
});

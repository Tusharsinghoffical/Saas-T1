import { groqChatCompletion } from "@/infrastructure/ai/groqClient";
import { weeklySummaryPrompt } from "@/infrastructure/ai/promptTemplates";
import { sendEmail, buildNotificationEmailHtml } from "@/infrastructure/email/resendClient";
import { recordActivityLogUseCase } from "@/domains/activity";
import { orgRepository, IOrgRepository } from "@/domains/organization/repository/orgRepository";
import { taskRepository, ITaskRepository } from "@/domains/tasks/repository/taskRepository";

export async function generateWeeklySummaryUseCase(
  orgRepo: IOrgRepository = orgRepository,
  taskRepo: ITaskRepository = taskRepository
): Promise<{
  success: boolean;
  mode?: string;
  processedOrgs: number;
  results: any[];
}> {
  const results: any[] = [];
  const orgs = await orgRepo.listOrganizations();

  for (const org of orgs) {
    try {
      const stats = await taskRepo.getOrgWeeklyStats(org.id);

      const orgStats = {
        orgName: org.name,
        completedCount: stats.completedCount,
        overdueCount: stats.overdueCount,
        totalActive: stats.totalActive,
        topBlockers: stats.topBlockers,
      };

      const { system, user } = weeklySummaryPrompt(orgStats);
      const aiResponse = await groqChatCompletion({
        systemPrompt: system,
        userPrompt: user,
        model: "llama-3.3-70b-versatile",
        responseFormat: "json_object",
        temperature: 0.2,
      });

      let summaryData;
      try {
        summaryData = JSON.parse(aiResponse.content);
      } catch {
        summaryData = {
          headline: `Weekly Progress Digest for ${org.name}`,
          keyHighlights: [`${stats.completedCount} tasks completed in the past 7 days`],
          risks: stats.overdueCount > 0 ? [`${stats.overdueCount} tasks currently overdue`] : [],
          recommendations: ["Review team priorities for next sprint"],
        };
      }

      let emailsSent = 0;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tasq-one.com";

      for (const emailAddress of stats.adminEmails) {
        await sendEmail({
          to: emailAddress,
          subject: `[TASQ-ONE] Weekly Executive Digest — ${org.name}`,
          html: buildNotificationEmailHtml({
            title: summaryData.headline || `Weekly Digest — ${org.name}`,
            message: `
              <p><strong>Key Highlights:</strong></p>
              <ul>${summaryData.keyHighlights?.map((h: string) => `<li>${h}</li>`).join("") || ""}</ul>
              ${
                summaryData.risks?.length
                  ? `<p><strong>Identified Risks:</strong></p><ul>${summaryData.risks.map((r: string) => `<li>${r}</li>`).join("")}</ul>`
                  : ""
              }
              <p><strong>Strategic Recommendations:</strong></p>
              <ul>${summaryData.recommendations?.map((rec: string) => `<li>${rec}</li>`).join("") || ""}</ul>
            `,
            actionUrl: `${appUrl}/admin/dashboard`,
            actionText: "Open Admin Dashboard",
          }),
        });
        emailsSent += 1;
      }

      await recordActivityLogUseCase({
        orgId: org.id,
        actorId: null,
        action: "system.weekly_summary",
        entity: "organizations",
        entityId: org.id,
        diff: {
          headline: summaryData.headline,
          completedCount: stats.completedCount,
          overdueCount: stats.overdueCount,
          emailsSent,
          status: "success",
        },
      });

      results.push({
        orgId: org.id,
        orgName: org.name,
        headline: summaryData.headline,
        emailsSent,
        status: "success",
      });
    } catch (orgErr: any) {
      console.error(`[Weekly Summary Error for ${org.id}]`, orgErr);
      await recordActivityLogUseCase({
        orgId: org.id,
        actorId: null,
        action: "system.weekly_summary",
        entity: "organizations",
        entityId: org.id,
        diff: { error: orgErr.message, status: "failed" },
      });

      results.push({
        orgId: org.id,
        orgName: org.name,
        error: orgErr.message,
        status: "failed",
      });
    }
  }

  return {
    success: true,
    processedOrgs: orgs.length,
    results,
  };
}

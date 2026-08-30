import { requireAuth } from "@/shared/middleware/rbacGuard";
import { enhanceTaskWithAIUseCase } from "../usecases/enhanceTaskWithAI";
import { suggestAssigneeUseCase } from "../usecases/suggestAssignee";
import { generateWeeklySummaryUseCase } from "../usecases/generateWeeklySummary";
import { UnauthorizedError } from "@/shared/errors/domainErrors";

export class AIController {
  async enhanceTask(body: any) {
    const auth = await requireAuth();
    const rawText = body?.text || "";
    return await enhanceTaskWithAIUseCase(auth, rawText);
  }

  async suggestAssignee(body: any) {
    const auth = await requireAuth();
    const taskTitle = body?.taskTitle || "New Task";
    return await suggestAssigneeUseCase(auth, taskTitle);
  }

  async weeklySummary(authHeader?: string | null, isVercelCron?: boolean) {
    const cronSecret = process.env.CRON_SECRET;

    // ── SECURITY FIX (FAIL 7.8): Hard-abort on invalid/missing cron token.
    // Previously the function warned and continued executing, allowing
    // unauthenticated callers to exhaust Groq LLM and Resend quotas.
    // Now: if CRON_SECRET is configured (non-placeholder), the request MUST
    // present a valid Bearer token OR be a verified Vercel Cron invocation.
    // Any other case throws UnauthorizedError immediately — no LLM/email call.
    if (cronSecret && cronSecret !== "placeholder") {
      const isValidBearer = authHeader === `Bearer ${cronSecret}`;
      if (!isValidBearer && !isVercelCron) {
        throw new UnauthorizedError(
          "Unauthorized cron invocation: Invalid or missing CRON_SECRET"
        );
      }
    }

    return await generateWeeklySummaryUseCase();
  }
}

export const aiController = new AIController();

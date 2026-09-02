import crypto from "crypto";
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

  async weeklySummary(authHeader?: string | null) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      throw new UnauthorizedError("CRON_SECRET is not configured on server.");
    }
    const expectedHeader = `Bearer ${cronSecret}`;
    const providedHeader = authHeader || "";
    if (
      providedHeader.length !== expectedHeader.length ||
      !crypto.timingSafeEqual(Buffer.from(providedHeader), Buffer.from(expectedHeader))
    ) {
      throw new UnauthorizedError("Unauthorized cron invocation: Invalid or missing token.");
    }
    return await generateWeeklySummaryUseCase();
  }
}

export const aiController = new AIController();

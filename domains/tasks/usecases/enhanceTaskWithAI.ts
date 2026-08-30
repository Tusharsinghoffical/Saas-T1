import { RequestContext } from "@/shared/types/context";
import { checkRateLimit } from "@/infrastructure/redis/redisClient";
import { groqChatCompletion } from "@/infrastructure/ai/groqClient";
import { enhanceTaskPrompt } from "@/infrastructure/ai/promptTemplates";
import { RateLimitError, ValidationError } from "@/shared/errors/domainErrors";

const AI_RATE_LIMIT_PER_HOUR = 30;
const GROQ_TIMEOUT_MS = 5000;

export async function enhanceTaskWithAIUseCase(
  context: RequestContext,
  rawText: string
): Promise<{
  original: string;
  enhanced: string;
  title: string;
  priority: string;
  suggestedTags: string[];
  checklist: string[];
  model?: string;
  isFallback: boolean;
  fallbackReason?: string;
}> {
  const text = (rawText || "").trim();
  if (!text) {
    throw new ValidationError("Please enter a task title or description to enhance.");
  }

  // 1. Rate Limit Bucket per Org (Max 30 calls per hour)
  const rateLimitKey = `ai:ratelimit:${context.orgId}`;
  const rateLimit = await checkRateLimit(rateLimitKey, AI_RATE_LIMIT_PER_HOUR, 3600);

  if (!rateLimit.success) {
    throw new RateLimitError(
      `AI rate limit exceeded (${AI_RATE_LIMIT_PER_HOUR} calls/hour on free tier). Resets in ${rateLimit.resetInSeconds}s.`,
      rateLimit.resetInSeconds
    );
  }

  // 2. Groq AI call with 5-second Timeout Fallback
  const { system, user } = enhanceTaskPrompt(text);

  const groqPromise = groqChatCompletion({
    systemPrompt: system,
    userPrompt: user,
    model: "llama-3.3-70b-versatile",
    responseFormat: "json_object",
    temperature: 0.2,
  });

  const timeoutPromise = new Promise<{
    success: false;
    content: string;
    model: string;
    error: string;
  }>((resolve) =>
    setTimeout(
      () =>
        resolve({
          success: false,
          content: "",
          model: "fallback",
          error: "Groq AI call timed out (>5s).",
        }),
      GROQ_TIMEOUT_MS
    )
  );

  const completion = await Promise.race([groqPromise, timeoutPromise]);

  if (!completion.success) {
    // Graceful Fallback: Return structured echo without erroring the request
    return {
      original: text,
      enhanced: `**Objective:**\n${text}\n\n**Acceptance Criteria:**\n- Complete task objectives as described\n- Verify implementation quality`,
      title: text.slice(0, 50),
      priority: "medium",
      suggestedTags: ["general"],
      checklist: ["Review requirements", "Implement changes", "Verify completion"],
      isFallback: true,
      fallbackReason: completion.error || "Groq timeout",
    };
  }

  let parsedResult;
  try {
    parsedResult = JSON.parse(completion.content);
  } catch {
    parsedResult = {
      title: text.slice(0, 50),
      description: completion.content || text,
      priority: "medium",
      suggestedTags: ["ai-enhanced"],
      checklist: [],
    };
  }

  return {
    original: text,
    enhanced: parsedResult.description || completion.content,
    title: parsedResult.title || text.slice(0, 50),
    priority: parsedResult.priority || "medium",
    suggestedTags: parsedResult.suggestedTags || [],
    checklist: parsedResult.checklist || [],
    model: completion.model,
    isFallback: false,
  };
}

import { RequestContext } from "@/shared/types/context";
import { checkRateLimit } from "@/infrastructure/redis/redisClient";
import { groqChatCompletion } from "@/infrastructure/ai/groqClient";
import { workloadSuggestionPrompt } from "@/infrastructure/ai/promptTemplates";
import { userRepository, IUserRepository } from "@/domains/users/repository/userRepository";
import { taskRepository, ITaskRepository } from "@/domains/tasks/repository/taskRepository";
import { RateLimitError } from "@/shared/errors/domainErrors";

const AI_RATE_LIMIT_PER_HOUR = 30;
const GROQ_TIMEOUT_MS = 5000;

export async function suggestAssigneeUseCase(
  context: RequestContext,
  taskTitle: string = "New Task",
  userRepo: IUserRepository = userRepository,
  taskRepo: ITaskRepository = taskRepository
): Promise<{
  candidates: { id: string; name: string; openTaskCount: number; skills?: string[] }[];
  recommendedAssignee?: string;
  recommendedUserId?: string | null;
  confidenceScore: number;
  reasoning?: string;
  workloadBalanceScore: number;
  model?: string;
  isFallback: boolean;
  fallbackReason?: string;
}> {
  // 1. Rate Limit Bucket per Org (Max 30 calls per hour)
  const rateLimitKey = `ai:ratelimit:${context.orgId}`;
  const rateLimit = await checkRateLimit(rateLimitKey, AI_RATE_LIMIT_PER_HOUR, 3600);

  if (!rateLimit.success) {
    throw new RateLimitError(
      `AI rate limit exceeded (${AI_RATE_LIMIT_PER_HOUR} calls/hour on free tier). Resets in ${rateLimit.resetInSeconds}s.`,
      rateLimit.resetInSeconds
    );
  }

  const members = await userRepo.listOrgMembers(context.orgId);
  const countMap = await taskRepo.getActiveTaskCountByUser(context.orgId);

  const candidates = members.map((m) => ({
    id: m.id,
    name: m.fullName || "Team Member",
    openTaskCount: countMap[m.id] || 0,
  }));

  const sortedCandidates = [...candidates].sort((a, b) => a.openTaskCount - b.openTaskCount);
  const lowestBacklogCandidate = sortedCandidates[0];

  // 2. Groq AI call with 5-second Timeout Fallback
  const { system, user } = workloadSuggestionPrompt(candidates, taskTitle);

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
    return {
      candidates,
      recommendedAssignee: lowestBacklogCandidate?.name || "Unassigned",
      recommendedUserId: lowestBacklogCandidate?.id || null,
      confidenceScore: 0.7,
      reasoning: `${lowestBacklogCandidate?.name || "Candidate"} has the lightest open backlog (${lowestBacklogCandidate?.openTaskCount || 0} active tasks).`,
      workloadBalanceScore: 80,
      isFallback: true,
      fallbackReason: completion.error || "Groq timeout",
    };
  }

  let parsedResult;
  try {
    parsedResult = JSON.parse(completion.content);
  } catch {
    parsedResult = {
      recommendedAssignee: lowestBacklogCandidate?.name,
      confidenceScore: 0.8,
      reasoning: `${lowestBacklogCandidate?.name} currently has ${lowestBacklogCandidate?.openTaskCount} active tasks.`,
      workloadBalanceScore: 85,
    };
  }

  const matchedUser = candidates.find(
    (c) =>
      c.name.toLowerCase() ===
      (parsedResult.recommendedAssignee || "").toLowerCase()
  );

  return {
    candidates,
    recommendedAssignee: parsedResult.recommendedAssignee || lowestBacklogCandidate?.name,
    recommendedUserId: matchedUser?.id || lowestBacklogCandidate?.id,
    confidenceScore: parsedResult.confidenceScore || 0.9,
    reasoning: parsedResult.reasoning,
    workloadBalanceScore: parsedResult.workloadBalanceScore || 85,
    model: completion.model,
    isFallback: false,
  };
}

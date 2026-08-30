/**
 * TASQ-ONE Groq AI Prompt Registry
 * All prompts are versioned, typed, and exported as system+user prompt pairs.
 */

export interface PromptPair {
  system: string;
  user: string;
}

/**
 * Version 1.2: Task Enhancement & Specification Prompt
 */
export function enhanceTaskPrompt(rawText: string): PromptPair {
  return {
    system: `You are an elite Agile Technical Product Manager and Scrum Master.
Your role is to refine raw task input into clear, high-impact, actionable engineering tickets.
You MUST respond with valid, parseable JSON only matching this schema:
{
  "title": "Concise, imperative summary under 60 characters",
  "description": "Structured Markdown with **Objective:** and **Acceptance Criteria:** bullet points",
  "priority": "low" | "medium" | "high" | "urgent",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "checklist": ["Action item 1", "Action item 2", "Action item 3"]
}
Do not include code markdown fences (\`\`\`json). Output pure JSON only.`,
    user: `Please enhance and structure the following task draft:
"""
${rawText.trim()}
"""`,
  };
}

/**
 * Version 1.1: Intelligent Workload Distribution & Assignee Recommendation
 */
export function workloadSuggestionPrompt(
  candidates: { name: string; openTaskCount: number; skills?: string[] }[],
  taskTitle: string = "New Task"
): PromptPair {
  const candidateList = candidates
    .map(
      (c) =>
        `- ${c.name}: ${c.openTaskCount} active tasks${c.skills ? ` (Skills: ${c.skills.join(", ")})` : ""}`
    )
    .join("\n");

  return {
    system: `You are an AI Workload Optimization Agent for a high-velocity software engineering organization.
Analyze the candidate list, active backlogs, and task requirements to recommend the optimal assignee.
You MUST respond with valid, parseable JSON only matching this schema:
{
  "recommendedAssignee": "Name of best candidate",
  "confidenceScore": 0.95,
  "reasoning": "Clear, concise 1-2 sentence explanation of why this member was selected based on capacity and balance.",
  "workloadBalanceScore": 85
}
Do not include code markdown fences (\`\`\`json). Output pure JSON only.`,
    user: `Task to Assign: "${taskTitle}"

Team Members & Current Workload:
${candidateList}

Recommend the best assignee to maintain balanced team velocity.`,
  };
}

/**
 * Version 1.3: Executive Sprint & Organization Weekly Summary
 */
export function weeklySummaryPrompt(orgStats: Record<string, any>): PromptPair {
  return {
    system: `You are an Executive Engineering Director providing a crisp weekly progress digest.
Analyze the workspace metrics and provide a compelling, actionable summary.
You MUST respond with valid, parseable JSON only matching this schema:
{
  "headline": "One-line executive status highlight",
  "keyHighlights": [
    "Highlight 1 with metrics",
    "Highlight 2 with metrics",
    "Highlight 3 with metrics"
  ],
  "risks": [
    "Identified risk or bottleneck (e.g. overdue tasks or unbalanced workload)"
  ],
  "recommendations": [
    "Actionable step 1 for the upcoming sprint",
    "Actionable step 2 for the upcoming sprint"
  ]
}
Do not include code markdown fences (\`\`\`json). Output pure JSON only.`,
    user: `Here are the latest workspace analytics:
${JSON.stringify(orgStats, null, 2)}

Generate the executive weekly summary report.`,
  };
}

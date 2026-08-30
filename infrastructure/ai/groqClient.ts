/**
 * Groq AI Client Wrapper (Zero AWS, lightweight fetch-based OpenAI-compatible API)
 * Default Model: llama-3.3-70b-versatile
 */

export interface GroqCompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  responseFormat?: "text" | "json_object";
  maxTokens?: number;
}

export interface GroqCompletionResult {
  content: string;
  success: boolean;
  model: string;
  error?: string;
}

export async function groqChatCompletion({
  systemPrompt,
  userPrompt,
  model = "llama-3.3-70b-versatile",
  temperature = 0.2,
  responseFormat = "text",
  maxTokens = 1500,
}: GroqCompletionOptions): Promise<GroqCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.includes("placeholder") || !apiKey.startsWith("gsk_")) {
    // Return formatted mock when valid API key is absent
    if (responseFormat === "json_object") {
      if (
        userPrompt.toLowerCase().includes("enhance") ||
        systemPrompt.toLowerCase().includes("enhance")
      ) {
        return {
          success: true,
          model: `${model} (demo-mode)`,
          content: JSON.stringify({
            title: "Enhanced: " + userPrompt.slice(0, 45).replace(/["']/g, ""),
            description: `**Objective:**\n${userPrompt}\n\n**Acceptance Criteria:**\n- Verify end-to-end functionality\n- Ensure zero console errors & full test coverage\n- Document user-facing changes`,
            priority: "high",
            suggestedTags: ["feature", "core", "ai-optimized"],
            checklist: [
              "Review requirement specs",
              "Implement core logic",
              "Execute automated verification",
            ],
          }),
        };
      }

      if (
        userPrompt.toLowerCase().includes("workload") ||
        systemPrompt.toLowerCase().includes("workload")
      ) {
        return {
          success: true,
          model: `${model} (demo-mode)`,
          content: JSON.stringify({
            recommendedAssignee: "Alex Smith",
            confidenceScore: 0.94,
            reasoning:
              "Alex Smith has the lowest open task backlog (1 active task) and relevant specialization.",
            workloadBalanceScore: 88,
          }),
        };
      }

      if (
        userPrompt.toLowerCase().includes("summary") ||
        systemPrompt.toLowerCase().includes("summary")
      ) {
        return {
          success: true,
          model: `${model} (demo-mode)`,
          content: JSON.stringify({
            headline: "Strong Sprint Velocity: 88% Completion Rate",
            keyHighlights: [
              "Completed 24 core tasks across backend and frontend modules",
              "Resolved all overdue blocker dependencies in flight",
              "Optimized database queries with 60s Redis caching",
            ],
            risks: ["2 tasks approaching due date in next 24 hours"],
            recommendations: [
              "Rebalance upcoming sprint backlog across team members",
              "Schedule automated audit log archive before month end",
            ],
          }),
        };
      }

      return {
        success: true,
        model: `${model} (demo-mode)`,
        content: JSON.stringify({
          message: "Processed successfully",
          prompt: userPrompt,
        }),
      };
    }

    return {
      success: true,
      model: `${model} (demo-mode)`,
      content: `AI Analysis for: "${userPrompt}"\n\n- Streamlined workflow and reduced dependencies.\n- Ensured full isolation and zero latency overhead.`,
    };
  }

  try {
    const payload: Record<string, any> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    };

    if (responseFormat === "json_object") {
      payload.response_format = { type: "json_object" };
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        model,
        content: "",
        error: json.error?.message || "Groq API error",
      };
    }

    const content = json.choices?.[0]?.message?.content || "";
    return {
      success: true,
      model: json.model || model,
      content,
    };
  } catch (err: any) {
    return {
      success: false,
      model,
      content: "",
      error: err.message || "Failed to communicate with Groq API",
    };
  }
}

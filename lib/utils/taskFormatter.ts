/**
 * Utility for formatting and sanitizing task titles and descriptions.
 * Converts messy prompt strings and raw markdown dumps into clean, readable titles and previews.
 */
export function formatTaskDisplay(title: string, description?: string | null) {
  let cleanTitle = title ? title.trim() : "Untitled Task";
  let isAiEnhanced = false;
  let cleanObjective = "";
  let acceptanceCriteriaCount = 0;
  let cleanDescription = description ? description.trim() : "";

  // 1. Detect if AI enhanced
  if (/^enhanced:\s*/i.test(cleanTitle)) {
    isAiEnhanced = true;
    cleanTitle = cleanTitle.replace(/^enhanced:\s*/i, "").trim();
  }

  // 2. Extract core draft text if title contains raw draft prompt boilerplate
  // Example: "Please enhance and structure the following task draft: """ website dr """ "
  const promptDraftRegex = /(?:task draft|draft):\s*["'“”«»]*(.+?)["'“”«»]*\s*$/i;
  const draftMatch = cleanTitle.match(promptDraftRegex);
  if (draftMatch && draftMatch[1]) {
    const extracted = draftMatch[1].replace(/["'“”«»]/g, "").trim();
    if (extracted.length > 0) {
      cleanTitle = extracted.charAt(0).toUpperCase() + extracted.slice(1);
    }
  }

  // 3. Process description
  if (cleanDescription) {
    // Check if description has acceptance criteria
    const criteriaMatch = cleanDescription.match(/acceptance criteria:?\s*([\s\S]*)/i);
    if (criteriaMatch && criteriaMatch[1]) {
      const bullets = criteriaMatch[1].match(/[-*•]\s+([^\n\r]+)/g);
      if (bullets) {
        acceptanceCriteriaCount = bullets.length;
      }
    }

    // Extract objective
    const objMatch = cleanDescription.match(/\*\*Objective:\*\*\s*([^\*]+?)(?=\*\*|$)/i);
    if (objMatch && objMatch[1]) {
      const rawObj = objMatch[1].trim();
      const objDraftMatch = rawObj.match(promptDraftRegex);
      if (objDraftMatch && objDraftMatch[1]) {
        cleanObjective = objDraftMatch[1].replace(/["'“”«»]/g, "").trim();
      } else {
        cleanObjective = rawObj.replace(/["'“”«»]/g, "").trim();
      }
    }

    // Clean description of raw markdown symbols for preview
    cleanDescription = cleanDescription
      .replace(/\*\*Objective:\*\*/gi, "")
      .replace(/\*\*Acceptance Criteria:\*\*/gi, "")
      .replace(/\*\*/g, "")
      .replace(/["'“”«»]{2,}/g, "")
      .replace(/#+\s/g, "")
      .replace(/-\s+/g, " • ")
      .trim();

    // If description is just repeating the prompt boilerplate, summarize it cleanly
    if (cleanDescription.toLowerCase().includes("please enhance and structure the following task draft")) {
      cleanDescription = cleanObjective
        ? `Objective: ${cleanObjective}`
        : "Structured task with verified acceptance criteria";
    }
  }

  return {
    title: cleanTitle,
    isAiEnhanced,
    objective: cleanObjective,
    acceptanceCriteriaCount,
    cleanDescription,
  };
}

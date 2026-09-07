/**
 * Utility for formatting and sanitizing task titles and descriptions.
 * Converts messy prompt strings and raw markdown dumps into clean, readable titles and previews.
 */
export function formatTaskDisplay(title: string, description?: string | null) {
  let cleanTitle = title ? title.trim() : "Untitled Task";
  let isAiEnhanced = false;
  let cleanObjective = "";
  let acceptanceCriteria: string[] = [];
  let cleanDescription = description ? description.trim() : "";

  // 1. Detect if AI enhanced
  if (/^enhanced:\s*/i.test(cleanTitle)) {
    isAiEnhanced = true;
    cleanTitle = cleanTitle.replace(/^enhanced:\s*/i, "").trim();
  }

  // Helper to sanitize an extracted objective text
  const sanitizeObjective = (raw: string) => {
    let s = raw.trim();
    // Remove triple quotes or quotes
    s = s.replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim();
    // Strip prompt boilerplate if accidentally captured
    s = s.replace(/^(?:please\s+enhance\s+and\s+structure(?:\s+the\s+following\s+task\s+draft)?:?\s*)/i, "").trim();
    s = s.replace(/^(?:task\s+draft|draft):?\s*/i, "").trim();
    s = s.replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim();
    return s;
  };

  // 2. Extract actual core draft from triple quotes or quotes or draft prompt in description
  if (cleanDescription) {
    const tripleQuoteMatch = cleanDescription.match(/"""\s*([\s\S]*?)\s*"""/);
    if (tripleQuoteMatch && tripleQuoteMatch[1]?.trim()) {
      cleanObjective = sanitizeObjective(tripleQuoteMatch[1]);
    } else {
      const draftMatch = cleanDescription.match(/(?:task draft|draft):\s*["'“”«»]*(.+?)["'“”«»]*\s*(?:\n|\*\*|$)/i);
      if (draftMatch && draftMatch[1]?.trim()) {
        cleanObjective = sanitizeObjective(draftMatch[1]);
      } else {
        const objMatch = cleanDescription.match(/\*\*Objective:\*\*\s*([^\n\*]+)/i);
        if (objMatch && objMatch[1]?.trim()) {
          cleanObjective = sanitizeObjective(objMatch[1]);
        }
      }
    }
  }

  // Also check if title itself has draft prompt
  if (!cleanObjective) {
    const titleDraftMatch = cleanTitle.match(/(?:task draft|draft):\s*["'“”«»]*(.+?)["'“”«»]*\s*$/i);
    if (titleDraftMatch && titleDraftMatch[1]?.trim()) {
      cleanObjective = sanitizeObjective(titleDraftMatch[1]);
    }
  }

  // 3. If cleanTitle is just the boilerplate prompt (e.g. "Please enhance and structure the following ta...")
  // Replace cleanTitle with the extracted real objective!
  if (/^(?:please\s+enhance\s+and\s+structure|enhance\s+and\s+structure|task\s+draft)/i.test(cleanTitle)) {
    isAiEnhanced = true;
    if (cleanObjective) {
      cleanTitle = cleanObjective.charAt(0).toUpperCase() + cleanObjective.slice(1);
    }
  } else if (cleanTitle.length > 25 && cleanTitle.toLowerCase().includes("please enhance")) {
    isAiEnhanced = true;
    if (cleanObjective) {
      cleanTitle = cleanObjective.charAt(0).toUpperCase() + cleanObjective.slice(1);
    }
  }

  // 4. Parse Acceptance Criteria list from description
  if (cleanDescription) {
    const criteriaSection = cleanDescription.split(/acceptance criteria:?/i)[1];
    if (criteriaSection) {
      const bulletMatches = criteriaSection.match(/[-*•]\s+([^\n\r]+)/g);
      if (bulletMatches) {
        acceptanceCriteria = bulletMatches.map((b) => b.replace(/^[-*•]\s+/, "").trim());
      }
    }

    // Format clean preview description
    if (acceptanceCriteria.length > 0) {
      cleanDescription = `${acceptanceCriteria.join(" • ")}`;
    } else if (cleanObjective) {
      cleanDescription = cleanObjective;
    } else {
      cleanDescription = cleanDescription
        .replace(/\*\*Objective:\*\*/gi, "")
        .replace(/\*\*Acceptance Criteria:\*\*/gi, "")
        .replace(/\*\*/g, "")
        .replace(/["'“”«»]{2,}/g, "")
        .replace(/#+\s/g, "")
        .replace(/-\s+/g, " • ")
        .trim();
    }
  }

  return {
    title: cleanTitle,
    isAiEnhanced,
    objective: cleanObjective,
    acceptanceCriteria,
    acceptanceCriteriaCount: acceptanceCriteria.length,
    cleanDescription,
  };
}


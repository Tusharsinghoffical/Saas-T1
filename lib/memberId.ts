/**
 * Utility functions for Member & Employee ID formatting, badge generation,
 * and high-efficiency search by ID, Code, Name, and Email.
 */

export type MemberRole = "admin" | "manager" | "employee" | string;

/**
 * Returns a standardized, human-readable Member Code (e.g., EMP-835DCB, MGR-4F2A19, ADM-9E1102)
 */
export function formatMemberCode(id: string | null | undefined, role?: MemberRole): string {
  if (!id) return "EMP-000000";
  const cleanRole = (role || "").toLowerCase();
  const prefix = cleanRole === "admin" ? "ADM" : cleanRole === "manager" ? "MGR" : "EMP";
  const hex = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `${prefix}-${hex.padEnd(6, "0")}`;
}

/**
 * Returns the short 8-character UUID slice (e.g. 835dcbc6)
 */
export function getShortId(id: string | null | undefined): string {
  if (!id) return "--------";
  return id.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 8);
}

/**
 * Checks if a search query matches a member by ID, Member Code, Name, Email, or Team.
 */
export function matchesMemberSearch(
  member: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
    teamName?: string | null;
  },
  searchQuery: string
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;

  const rawQuery = searchQuery.trim().toLowerCase();
  const cleanQuery = rawQuery.replace(/[^a-z0-9]/g, ""); // Strips dashes, hashes, spaces

  // 1. Check Full Name
  if (member.fullName && member.fullName.toLowerCase().includes(rawQuery)) {
    return true;
  }

  // 2. Check Email
  if (member.email && member.email.toLowerCase().includes(rawQuery)) {
    return true;
  }

  // 3. Check Team Name
  if (member.teamName && member.teamName.toLowerCase().includes(rawQuery)) {
    return true;
  }

  // 4. Check Raw UUID (Full or partial substring)
  if (member.id && member.id.toLowerCase().includes(rawQuery)) {
    return true;
  }

  // 5. Check Normalized ID (without dashes)
  if (member.id) {
    const cleanId = member.id.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (cleanQuery && cleanId.includes(cleanQuery)) {
      return true;
    }
  }

  // 6. Check Formatted Member Code (e.g. EMP-835DCB, MGR-XXXXXX)
  const memberCode = formatMemberCode(member.id, member.role || "employee").toLowerCase();
  if (memberCode.includes(rawQuery)) {
    return true;
  }
  const cleanMemberCode = memberCode.replace(/[^a-z0-9]/g, "");
  if (cleanQuery && cleanMemberCode.includes(cleanQuery)) {
    return true;
  }

  // 7. Check Role name (e.g. "manager", "admin", "employee")
  if (member.role && member.role.toLowerCase().includes(rawQuery)) {
    return true;
  }

  return false;
}

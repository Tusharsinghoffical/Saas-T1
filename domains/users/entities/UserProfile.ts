/**
 * Pure Domain Entities: UserProfile & TeamMember
 * ZERO framework or database imports.
 */

export interface UserProfile {
  id: string;
  orgId: string | null;
  fullName: string | null;
  role: "admin" | "manager" | "employee";
  avatarUrl?: string | null;
  position?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  department?: string | null;
  email?: string;
  teamId?: string | null;
  teamName?: string | null;
  notificationPreferences?: Record<string, boolean> | null;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  position?: string | null;
  phoneNumber?: string | null;
  openTaskCount?: number;
  skills?: string[];
}

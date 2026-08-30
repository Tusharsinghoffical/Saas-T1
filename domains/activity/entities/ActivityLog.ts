/**
 * Pure Domain Entities: ActivityLog & ActivityFilterDTO
 * ZERO framework or database imports.
 */

export interface ActivityActor {
  id: string;
  fullName: string | null;
  avatarUrl?: string | null;
}

export interface ActivityLog {
  id: string;
  orgId: string;
  actorId?: string | null;
  actor?: ActivityActor;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: Record<string, any> | null;
  createdAt: string;
}

export interface ActivityLogInput {
  orgId: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: Record<string, any> | null;
}

export interface ActivityFilterDTO {
  page: number;
  limit: number;
  entity?: string | null;
  action?: string | null;
  format?: string | null;
}

import { RequestContext } from "@/shared/types/context";
import { ForbiddenError } from "@/shared/errors/domainErrors";
import { createClient } from "@/infrastructure/supabase/supabaseServer";

export interface ExportDataResult {
  exportVersion: string;
  exportedAt: string;
  organization: {
    id: string;
    name: string;
    timezone?: string;
    createdAt?: string;
  };
  teams: any[];
  members: any[];
  tasks: any[];
  activity: any[];
}

/**
 * Exports all organization data for GDPR/CCPA self-serve compliance.
 * Restricted strictly to organization admin and enforced via cookie-scoped RLS client.
 */
export async function exportOrgDataUseCase(
  context: RequestContext,
  customClient?: any
): Promise<ExportDataResult> {
  if (context.role !== "admin") {
    throw new ForbiddenError("Only organization admins can export organization data.");
  }

  const client = customClient || createClient();
  const orgId = context.orgId;

  // 1. Fetch organization metadata
  const { data: orgData } = await (client.from("organizations") as any)
    .select("id, name, timezone, created_at")
    .eq("id", orgId)
    .maybeSingle();

  // 2. Fetch teams
  const { data: teamsData } = await (client.from("teams") as any)
    .select("id, name, manager_id")
    .eq("org_id", orgId);

  // 3. Fetch user profiles (exclude any deleted/internal tokens)
  const { data: profilesData } = await (client.from("profiles") as any)
    .select("id, full_name, role, avatar_url, created_at")
    .eq("org_id", orgId);

  // 4. Fetch tasks
  const { data: tasksData } = await (client.from("tasks") as any)
    .select("id, team_id, title, description, status, priority, due_date, created_at, updated_at")
    .eq("org_id", orgId);

  // 5. Fetch task attachments metadata & comments for tasks belonging to this org
  const taskIds = (tasksData || []).map((t: any) => t.id);
  let attachmentsData: any[] = [];
  let commentsData: any[] = [];

  if (taskIds.length > 0) {
    const { data: atts } = await (client.from("task_attachments") as any)
      .select("id, task_id, file_name, file_url, created_at")
      .in("task_id", taskIds);
    attachmentsData = atts || [];

    const { data: comms } = await (client.from("task_comments") as any)
      .select("id, task_id, user_id, content, created_at")
      .in("task_id", taskIds);
    commentsData = comms || [];
  }

  // Combine tasks with their nested attachments and comments
  const enrichedTasks = (tasksData || []).map((t: any) => ({
    ...t,
    attachments: attachmentsData.filter((a: any) => a.task_id === t.id),
    comments: commentsData.filter((c: any) => c.task_id === t.id),
  }));

  // 6. Fetch activity log audit trail
  const { data: activityData } = await (client.from("activity_logs") as any)
    .select("id, action, entity, entity_id, diff, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1000);

  return {
    exportVersion: "1.0",
    exportedAt: new Date().toISOString(),
    organization: orgData || { id: orgId, name: "Workspace" },
    teams: teamsData || [],
    members: profilesData || [],
    tasks: enrichedTasks,
    activity: activityData || [],
  };
}

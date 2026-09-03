import { createAdminClient, createClient } from "@/infrastructure/supabase/supabaseServer";

export interface SeedTaskResult {
  success: boolean;
  tasksCount: number;
  message: string;
}

/**
 * Seeds rich starter tasks, teams, and activity for an organization workspace
 * if the organization has zero tasks. Ensures the dashboard is never a blank ghost town.
 */
export async function seedWorkspaceDataUseCase(
  orgId: string,
  actorId?: string | null
): Promise<SeedTaskResult> {
  if (!orgId) {
    return { success: false, tasksCount: 0, message: "Missing orgId" };
  }

  // Use admin client if available to bypass any RLS bootstrapping race conditions
  let client: any;
  try {
    client = createAdminClient();
  } catch {
    client = createClient();
  }

  // 1. Check if tasks already exist in this organization
  const { data: existingTasks } = await (client.from("tasks") as any)
    .select("id")
    .eq("org_id", orgId)
    .limit(1);

  if (existingTasks && existingTasks.length > 0) {
    return {
      success: true,
      tasksCount: existingTasks.length,
      message: "Workspace already contains tasks.",
    };
  }

  // 2. Ensure at least one default team exists
  let defaultTeamId: string | null = null;
  try {
    const { data: existingTeams } = await (client.from("teams") as any)
      .select("id")
      .eq("org_id", orgId)
      .limit(1);

    if (existingTeams && existingTeams.length > 0) {
      defaultTeamId = existingTeams[0].id;
    } else {
      const { data: newTeam } = await (client.from("teams") as any)
        .insert({
          org_id: orgId,
          name: "Engineering & Product",
        })
        .select("id")
        .maybeSingle();

      if (newTeam?.id) {
        defaultTeamId = newTeam.id;
      }
    }
  } catch (err) {
    console.warn("[seedWorkspaceData] Team check warning:", err);
  }

  // 3. Define 6 realistic, interactive starter tasks
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const starterTasks = [
    {
      org_id: orgId,
      team_id: defaultTeamId,
      title: "Initialize TASQ-ONE Work OS Workspace",
      description: "Welcome to your organization portal. Configure your profile, notification channels, and workspace preferences.",
      status: "completed",
      priority: "low",
      due_date: new Date(now - dayMs * 1).toISOString(),
      created_by: actorId || null,
      created_at: new Date(now - dayMs * 3).toISOString(),
      updated_at: new Date(now - dayMs * 1).toISOString(),
    },
    {
      org_id: orgId,
      team_id: defaultTeamId,
      title: "Review Sprint Milestones & Task Delegation",
      description: "Organize pending backlog items, estimate delivery velocity, and align priorities with team managers.",
      status: "in_progress",
      priority: "high",
      due_date: new Date(now + dayMs * 2).toISOString(),
      created_by: actorId || null,
      created_at: new Date(now - dayMs * 2).toISOString(),
      updated_at: new Date(now).toISOString(),
    },
    {
      org_id: orgId,
      team_id: defaultTeamId,
      title: "Connect Repository URLs & Project Roadmaps",
      description: "Link GitHub repositories, PRs, and architectural design docs directly in task detail views.",
      status: "in_progress",
      priority: "urgent",
      due_date: new Date(now + dayMs * 1).toISOString(),
      created_by: actorId || null,
      created_at: new Date(now - dayMs * 1).toISOString(),
      updated_at: new Date(now).toISOString(),
    },
    {
      org_id: orgId,
      team_id: defaultTeamId,
      title: "Verify Workspace Security & Member Access",
      description: "Audit role hierarchy (Admin, Manager, Employee) and review multi-tenant row-level access controls.",
      status: "in_review",
      priority: "medium",
      due_date: new Date(now + dayMs * 3).toISOString(),
      created_by: actorId || null,
      created_at: new Date(now - dayMs * 2).toISOString(),
      updated_at: new Date(now).toISOString(),
    },
    {
      org_id: orgId,
      team_id: defaultTeamId,
      title: "Invite Team Members & Set Department Roles",
      description: "Send invite magic links to managers and teammates to start collaborative real-time Kanban tracking.",
      status: "pending",
      priority: "high",
      due_date: new Date(now + dayMs * 5).toISOString(),
      created_by: actorId || null,
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    },
    {
      org_id: orgId,
      team_id: defaultTeamId,
      title: "Test AI Workload Balancing & Smart Enhancer",
      description: "Try generating AI task descriptions and smart assignee recommendations powered by Groq Llama 3.",
      status: "pending",
      priority: "medium",
      due_date: new Date(now + dayMs * 7).toISOString(),
      created_by: actorId || null,
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    },
  ];

  try {
    const { data: insertedTasks, error: insertError } = await (client.from("tasks") as any)
      .insert(starterTasks)
      .select("id, title, status");

    if (insertError) {
      console.error("[seedWorkspaceData] Task insertion error:", insertError.message);
      return { success: false, tasksCount: 0, message: insertError.message };
    }

    // 4. Record initial activity log
    try {
      await (client.from("activity_logs") as any).insert({
        org_id: orgId,
        actor_id: actorId || null,
        action: "workspace.seeded",
        entity: "workspace",
        entity_id: orgId,
        diff: { message: "Seeded 6 starter tasks and Engineering team." },
      });
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      tasksCount: insertedTasks?.length || starterTasks.length,
      message: `Successfully seeded ${insertedTasks?.length || starterTasks.length} starter tasks.`,
    };
  } catch (err: any) {
    console.error("[seedWorkspaceData] Fatal error:", err);
    return { success: false, tasksCount: 0, message: err?.message || "Failed to seed tasks" };
  }
}

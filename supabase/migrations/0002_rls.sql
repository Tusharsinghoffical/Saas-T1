-- ==============================================================================
-- TASQ-ONE — Row-Level Security (RLS) Policies Migration
-- Migration: 0002_rls.sql
-- Stack: Supabase Postgres (Multi-Tenant Isolation via Postgres RLS & JWT claims)
-- ==============================================================================

-- ==============================================================================
-- 1. ENABLE ROW-LEVEL SECURITY ON ALL TENANT-SCOPED TABLES
-- ==============================================================================
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_dependencies enable row level security;
alter table task_comments enable row level security;
alter table task_attachments enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;

-- ==============================================================================
-- 2. PROFILES POLICIES
-- ==============================================================================
-- Allow users to read profiles within their own organization OR their own profile
create policy "profiles_select_policy"
on profiles for select
using (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  or id = auth.uid()
);

-- Allow admins to insert profiles in their org, or a user creating their own initial profile
create policy "profiles_insert_policy"
on profiles for insert
with check (
  id = auth.uid()
  or (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    and (auth.jwt() ->> 'role') = 'admin'
  )
);

-- Allow users to update their own profile, or admins to update profiles in their org
create policy "profiles_update_policy"
on profiles for update
using (
  id = auth.uid()
  or (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    and (auth.jwt() ->> 'role') = 'admin'
  )
)
with check (
  id = auth.uid()
  or (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    and (auth.jwt() ->> 'role') = 'admin'
  )
);

-- Only admins can delete profiles in their org
create policy "profiles_delete_policy"
on profiles for delete
using (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- 3. TEAMS POLICIES
-- ==============================================================================
create policy "teams_select_policy"
on teams for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

create policy "teams_insert_policy"
on teams for insert
with check (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') in ('admin', 'manager')
);

create policy "teams_update_policy"
on teams for update
using (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') in ('admin', 'manager')
)
with check (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') in ('admin', 'manager')
);

create policy "teams_delete_policy"
on teams for delete
using (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- 4. TEAM MEMBERS POLICIES
-- ==============================================================================
create policy "team_members_select_policy"
on team_members for select
using (
  exists (
    select 1 from teams
    where teams.id = team_members.team_id
    and teams.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "team_members_insert_policy"
on team_members for insert
with check (
  (auth.jwt() ->> 'role') in ('admin', 'manager')
  and exists (
    select 1 from teams
    where teams.id = team_members.team_id
    and teams.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "team_members_delete_policy"
on team_members for delete
using (
  (auth.jwt() ->> 'role') in ('admin', 'manager')
  and exists (
    select 1 from teams
    where teams.id = team_members.team_id
    and teams.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

-- ==============================================================================
-- 5. TASKS POLICIES (Core RBAC & Tenant Scoping)
-- ==============================================================================
-- All members in the org can read tasks in their org
create policy "tasks_select_policy"
on tasks for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Only Admin and Manager roles can insert tasks
create policy "tasks_insert_policy"
on tasks for insert
with check (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') in ('admin', 'manager')
);

-- Admin and Manager can update any task; Employees can update tasks assigned to them
create policy "tasks_update_policy"
on tasks for update
using (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (
    (auth.jwt() ->> 'role') in ('admin', 'manager')
    or (
      (auth.jwt() ->> 'role') = 'employee'
      and exists (
        select 1 from task_assignees
        where task_assignees.task_id = tasks.id
        and task_assignees.user_id = auth.uid()
      )
    )
  )
)
with check (
  org_id = (auth.jwt() ->> 'org_id')::uuid
);

-- Only Admin and Manager can delete tasks
create policy "tasks_delete_policy"
on tasks for delete
using (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') in ('admin', 'manager')
);

-- ==============================================================================
-- 6. TASK ASSIGNEES POLICIES
-- ==============================================================================
create policy "task_assignees_select_policy"
on task_assignees for select
using (
  exists (
    select 1 from tasks
    where tasks.id = task_assignees.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_assignees_insert_policy"
on task_assignees for insert
with check (
  (auth.jwt() ->> 'role') in ('admin', 'manager')
  and exists (
    select 1 from tasks
    where tasks.id = task_assignees.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_assignees_delete_policy"
on task_assignees for delete
using (
  (auth.jwt() ->> 'role') in ('admin', 'manager')
  and exists (
    select 1 from tasks
    where tasks.id = task_assignees.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

-- ==============================================================================
-- 7. TASK DEPENDENCIES POLICIES
-- ==============================================================================
create policy "task_dependencies_select_policy"
on task_dependencies for select
using (
  exists (
    select 1 from tasks
    where tasks.id = task_dependencies.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_dependencies_insert_policy"
on task_dependencies for insert
with check (
  (auth.jwt() ->> 'role') in ('admin', 'manager')
  and exists (
    select 1 from tasks
    where tasks.id = task_dependencies.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_dependencies_delete_policy"
on task_dependencies for delete
using (
  (auth.jwt() ->> 'role') in ('admin', 'manager')
  and exists (
    select 1 from tasks
    where tasks.id = task_dependencies.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

-- ==============================================================================
-- 8. TASK COMMENTS POLICIES
-- ==============================================================================
create policy "task_comments_select_policy"
on task_comments for select
using (
  exists (
    select 1 from tasks
    where tasks.id = task_comments.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_comments_insert_policy"
on task_comments for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from tasks
    where tasks.id = task_comments.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_comments_update_policy"
on task_comments for update
using (
  user_id = auth.uid()
  or (
    (auth.jwt() ->> 'role') = 'admin'
    and exists (
      select 1 from tasks
      where tasks.id = task_comments.task_id
      and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
);

create policy "task_comments_delete_policy"
on task_comments for delete
using (
  user_id = auth.uid()
  or (
    (auth.jwt() ->> 'role') = 'admin'
    and exists (
      select 1 from tasks
      where tasks.id = task_comments.task_id
      and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
);

-- ==============================================================================
-- 9. TASK ATTACHMENTS POLICIES
-- ==============================================================================
create policy "task_attachments_select_policy"
on task_attachments for select
using (
  exists (
    select 1 from tasks
    where tasks.id = task_attachments.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_attachments_insert_policy"
on task_attachments for insert
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from tasks
    where tasks.id = task_attachments.task_id
    and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy "task_attachments_delete_policy"
on task_attachments for delete
using (
  uploaded_by = auth.uid()
  or (
    (auth.jwt() ->> 'role') = 'admin'
    and exists (
      select 1 from tasks
      where tasks.id = task_attachments.task_id
      and tasks.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
);

-- ==============================================================================
-- 10. NOTIFICATIONS POLICIES
-- ==============================================================================
create policy "notifications_select_policy"
on notifications for select
using (user_id = auth.uid());

create policy "notifications_update_policy"
on notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notifications_delete_policy"
on notifications for delete
using (user_id = auth.uid());

create policy "notifications_insert_policy"
on notifications for insert
with check (
  user_id = auth.uid()
  or exists (
    select 1 from profiles
    where profiles.id = notifications.user_id
    and profiles.org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

-- ==============================================================================
-- 11. ACTIVITY LOGS POLICIES
-- ==============================================================================
-- Admin and Manager can view audit activity logs for their org
create policy "activity_logs_select_policy"
on activity_logs for select
using (
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') in ('admin', 'manager')
);

-- Any authenticated user can insert activity logs for their org
create policy "activity_logs_insert_policy"
on activity_logs for insert
with check (
  org_id = (auth.jwt() ->> 'org_id')::uuid
);

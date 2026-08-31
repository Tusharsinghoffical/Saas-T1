-- ==============================================================================
-- TASQ-ONE — Complete Master Clean Database Reset & Recreate Script
-- Target: Supabase Postgres (Cloud Dashboard SQL Editor)
-- Includes Migrations: 0001_init through 0009_soft_delete_and_referential_safety
-- ==============================================================================

-- ==============================================================================
-- STEP 1: DROP ALL EXISTING PUBLIC TABLES & TRIGGERS (CLEAN SLATE)
-- ==============================================================================

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists tr_notify_task_assigned on public.task_assignees;
drop trigger if exists tr_notify_comment_mention on public.task_comments;

drop table if exists public.subscriptions cascade;
drop table if exists public.slack_integrations cascade;
drop table if exists public.notifications cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.task_attachments cascade;
drop table if exists public.task_comments cascade;
drop table if exists public.task_dependencies cascade;
drop table if exists public.task_subtasks cascade;
drop table if exists public.task_assignees cascade;
drop table if exists public.tasks cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

-- Clean auth users if you want 100% fresh start
-- (Optional: deletes all mock auth credentials from auth.users)
truncate auth.users cascade;

-- ==============================================================================
-- STEP 2: EXTENSIONS & TABLES
-- ==============================================================================

create extension if not exists "pgcrypto";

-- 1. organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  timezone text default 'Asia/Kolkata',
  created_by uuid,
  created_at timestamptz default now()
);

-- 2. profiles (extends supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'manager', 'employee')) default 'employee',
  avatar_url text,
  deleted_at timestamptz default null,
  created_at timestamptz default now()
);

-- Add foreign key back to organizations.created_by
alter table public.organizations 
add constraint fk_organizations_created_by 
foreign key (created_by) references public.profiles(id) on delete set null;

-- Partial index for active profiles
create index idx_profiles_active on public.profiles(org_id) where deleted_at is null;

-- 3. teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  manager_id uuid references public.profiles(id) on delete set null
);

-- 4. team_members
create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

-- 5. tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  title text not null,
  description text,
  status text check (status in ('pending', 'in_progress', 'in_review', 'completed')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  due_date timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. task_assignees
create table public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

-- 7. task_subtasks
create table public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  is_completed boolean default false,
  position int default 0
);

-- 8. task_dependencies
create table public.task_dependencies (
  task_id uuid references public.tasks(id) on delete cascade,
  depends_on_task_id uuid references public.tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id)
);

-- 9. task_comments
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- 10. task_attachments
create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_size int,
  created_at timestamptz default now()
);

-- 11. activity_logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 12. notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 13. slack_integrations
create table public.slack_integrations (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  webhook_url text not null,
  channel text not null,
  created_at timestamptz default now()
);

-- 14. subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  razorpay_customer_id text,
  razorpay_subscription_id text unique,
  plan text check (plan in ('starter', 'growth', 'enterprise')) default 'starter',
  status text check (status in ('active', 'past_due', 'canceled', 'trialing')) default 'trialing',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- ==============================================================================
-- STEP 3: SECURITY HELPER FUNCTIONS
-- ==============================================================================

create or replace function public.get_user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select org_id from public.profiles where id = auth.uid() and deleted_at is null;
$$;

create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and deleted_at is null
  );
$$;

create or replace function public.is_task_manager(task_team_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.teams
    where id = task_team_id and manager_id = auth.uid()
  );
$$;

-- ==============================================================================
-- STEP 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.slack_integrations enable row level security;
alter table public.subscriptions enable row level security;

-- 1. Organizations Policies
create policy "Users can view their own organization"
on public.organizations for select
using (id = public.get_user_org_id());

create policy "Admins can update their own organization"
on public.organizations for update
using (id = public.get_user_org_id() and public.is_org_admin())
with check (id = public.get_user_org_id() and public.is_org_admin());

-- 2. Profiles Policies
create policy "Users can view active profiles in their org"
on public.profiles for select
using (org_id = public.get_user_org_id());

create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "Admins can insert profiles in their org"
on public.profiles for insert
with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can update profiles in their org"
on public.profiles for update
using (org_id = public.get_user_org_id() and public.is_org_admin())
with check (org_id = public.get_user_org_id() and public.is_org_admin());

create policy "Admins can delete profiles in their org"
on public.profiles for delete
using (org_id = public.get_user_org_id() and public.is_org_admin());

-- 3. Teams Policies
create policy "Users can view teams in their org"
on public.teams for select
using (org_id = public.get_user_org_id());

create policy "Admins can manage teams"
on public.teams for all
using (org_id = public.get_user_org_id() and public.is_org_admin())
with check (org_id = public.get_user_org_id() and public.is_org_admin());

-- 4. Team Members Policies
create policy "Users can view team members in their org"
on public.team_members for select
using (
  exists (
    select 1 from public.teams
    where teams.id = team_members.team_id
      and teams.org_id = public.get_user_org_id()
  )
);

create policy "Admins and Managers can manage team members"
on public.team_members for all
using (
  exists (
    select 1 from public.teams
    where teams.id = team_members.team_id
      and teams.org_id = public.get_user_org_id()
      and (public.is_org_admin() or teams.manager_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.teams
    where teams.id = team_members.team_id
      and teams.org_id = public.get_user_org_id()
      and (public.is_org_admin() or teams.manager_id = auth.uid())
  )
);

-- 5. Tasks Policies
create policy "Users can view tasks in their org"
on public.tasks for select
using (org_id = public.get_user_org_id());

create policy "Admins and Managers can create tasks"
on public.tasks for insert
with check (
  org_id = public.get_user_org_id()
  and (public.is_org_admin() or public.is_task_manager(team_id))
);

create policy "Admins and Managers can delete tasks"
on public.tasks for delete
using (
  org_id = public.get_user_org_id()
  and (public.is_org_admin() or public.is_task_manager(team_id))
);

create policy "Task update policy"
on public.tasks for update
using (
  org_id = public.get_user_org_id()
  and (
    public.is_org_admin()
    or public.is_task_manager(team_id)
    or exists (select 1 from public.task_assignees where task_id = tasks.id and user_id = auth.uid())
  )
)
with check (
  org_id = public.get_user_org_id()
  and (
    public.is_org_admin()
    or public.is_task_manager(team_id)
    or (
      exists (select 1 from public.task_assignees where task_id = tasks.id and user_id = auth.uid())
      and title = (select title from public.tasks where id = tasks.id)
      and org_id = (select org_id from public.tasks where id = tasks.id)
    )
  )
);

-- 6. Task Assignees Policies
create policy "Users can view task assignees in their org"
on public.task_assignees for select
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.org_id = public.get_user_org_id()
  )
);

create policy "Admins and Managers can manage task assignees"
on public.task_assignees for all
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.org_id = public.get_user_org_id()
      and (public.is_org_admin() or public.is_task_manager(tasks.team_id))
  )
)
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.org_id = public.get_user_org_id()
      and (public.is_org_admin() or public.is_task_manager(tasks.team_id))
  )
);

-- 7. Task Subtasks Policies
create policy "Users can view task subtasks in their org"
on public.task_subtasks for select
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_subtasks.task_id
      and tasks.org_id = public.get_user_org_id()
  )
);

create policy "Admins, Managers and Assignees can manage subtasks"
on public.task_subtasks for all
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_subtasks.task_id
      and tasks.org_id = public.get_user_org_id()
      and (
        public.is_org_admin()
        or public.is_task_manager(tasks.team_id)
        or exists (select 1 from public.task_assignees where task_id = tasks.id and user_id = auth.uid())
      )
  )
)
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_subtasks.task_id
      and tasks.org_id = public.get_user_org_id()
      and (
        public.is_org_admin()
        or public.is_task_manager(tasks.team_id)
        or exists (select 1 from public.task_assignees where task_id = tasks.id and user_id = auth.uid())
      )
  )
);

-- 8. Task Dependencies Policies
create policy "Users can view task dependencies in their org"
on public.task_dependencies for select
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_dependencies.task_id
      and tasks.org_id = public.get_user_org_id()
  )
);

create policy "Admins and Managers can manage task dependencies"
on public.task_dependencies for all
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_dependencies.task_id
      and tasks.org_id = public.get_user_org_id()
      and (public.is_org_admin() or public.is_task_manager(tasks.team_id))
  )
)
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_dependencies.task_id
      and tasks.org_id = public.get_user_org_id()
      and (public.is_org_admin() or public.is_task_manager(tasks.team_id))
  )
);

-- 9. Task Comments Policies
create policy "Users can view task comments in their org"
on public.task_comments for select
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_comments.task_id
      and tasks.org_id = public.get_user_org_id()
  )
);

create policy "Users can create task comments in their org"
on public.task_comments for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.tasks
    where tasks.id = task_comments.task_id
      and tasks.org_id = public.get_user_org_id()
  )
);

-- 10. Task Attachments Policies
create policy "Users can view task attachments in their org"
on public.task_attachments for select
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_attachments.task_id
      and tasks.org_id = public.get_user_org_id()
  )
);

create policy "Users can upload task attachments in their org"
on public.task_attachments for insert
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_attachments.task_id
      and tasks.org_id = public.get_user_org_id()
  )
);

-- 11. Activity Logs Policies
create policy "Users can view activity logs in their org"
on public.activity_logs for select
using (org_id = public.get_user_org_id());

create policy "System and users can insert activity logs in their org"
on public.activity_logs for insert
with check (org_id = public.get_user_org_id());

-- 12. Notifications Policies
create policy "Users can view and manage their own notifications"
on public.notifications for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 13. Slack Integrations Policies
create policy "Admins can manage slack integration"
on public.slack_integrations for all
using (org_id = public.get_user_org_id() and public.is_org_admin())
with check (org_id = public.get_user_org_id() and public.is_org_admin());

-- 14. Subscriptions Policies
create policy "Users can view org subscription"
on public.subscriptions for select
using (org_id = public.get_user_org_id());

-- ==============================================================================
-- STEP 5: SIGNUP ATOMIC RPC (ADMIN ONBOARDING)
-- ==============================================================================

create or replace function public.signup_organization_admin(
  p_org_name text,
  p_admin_user_id uuid,
  p_admin_full_name text
)
returns table (
  org_id uuid,
  org_name text,
  admin_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if not exists (select 1 from auth.users where id = p_admin_user_id) then
    raise exception 'Auth user does not exist in auth.users.';
  end if;

  if exists (select 1 from public.profiles where id = p_admin_user_id) then
    raise exception 'User is already assigned to a profile.';
  end if;

  insert into public.organizations (name, timezone, created_by)
  values (p_org_name, 'Asia/Kolkata', p_admin_user_id)
  returning id into v_org_id;

  insert into public.profiles (id, org_id, full_name, role)
  values (p_admin_user_id, v_org_id, p_admin_full_name, 'admin');

  return query
  select v_org_id, p_org_name, p_admin_user_id;
end;
$$;

revoke execute on function public.signup_organization_admin from public, anon;
grant execute on function public.signup_organization_admin to authenticated, service_role;

-- ==============================================================================
-- STEP 6: AUTOMATED NOTIFICATION TRIGGERS
-- ==============================================================================

create or replace function notify_on_task_assigned()
returns trigger
language plpgsql
security definer
as $$
declare
  v_task record;
  v_actor_name text;
begin
  select title, org_id, created_by into v_task from public.tasks where id = new.task_id;
  select full_name into v_actor_name from public.profiles where id = auth.uid();

  insert into public.notifications (user_id, type, payload, created_at)
  values (
    new.user_id,
    'task.assigned',
    jsonb_build_object(
      'task_id', new.task_id,
      'task_title', v_task.title,
      'actor_name', coalesce(v_actor_name, 'A team member'),
      'message', 'You were assigned to task: ' || v_task.title
    ),
    now()
  );

  return new;
end;
$$;

create trigger tr_notify_task_assigned
after insert on public.task_assignees
for each row
execute function notify_on_task_assigned();

create or replace function notify_on_comment_mention()
returns trigger
language plpgsql
security definer
as $$
declare
  v_task_title text;
  v_author_name text;
  v_mentioned_user record;
begin
  select title into v_task_title from public.tasks where id = new.task_id;
  select full_name into v_author_name from public.profiles where id = new.user_id;

  for v_mentioned_user in
    select id, full_name
    from public.profiles
    where new.body ~* ('@' || full_name)
      and id <> new.user_id
  loop
    insert into public.notifications (user_id, type, payload, created_at)
    values (
      v_mentioned_user.id,
      'task.mentioned',
      jsonb_build_object(
        'task_id', new.task_id,
        'task_title', v_task_title,
        'comment_id', new.id,
        'actor_name', coalesce(v_author_name, 'A team member'),
        'message', coalesce(v_author_name, 'A team member') || ' mentioned you in ' || v_task_title
      ),
      now()
    );
  end loop;

  return new;
end;
$$;

create trigger tr_notify_comment_mention
after insert on public.task_comments
for each row
execute function notify_on_comment_mention();

-- ==============================================================================
-- TASQ-ONE — Complete Master Database Setup Script
-- Combines Migrations: 0001_init to 0008_fix_privilege_escalation
-- Target: Supabase Postgres (Cloud Dashboard SQL Editor)
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: EXTENSIONS & TABLES (0001_init.sql)
-- ==============================================================================

create extension if not exists "pgcrypto";

-- 1. organizations
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now()
);

-- 2. profiles (extends supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'manager', 'employee')) default 'employee',
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  manager_id uuid references profiles(id)
);

-- 4. team_members
create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

-- 5. tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  team_id uuid references teams(id),
  title text not null,
  description text,
  status text check (status in ('pending', 'in_progress', 'in_review', 'completed')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  due_date timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. task_assignees
create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

-- 7. task_dependencies
create table if not exists task_dependencies (
  task_id uuid references tasks(id) on delete cascade,
  depends_on_task_id uuid references tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id)
);

-- 8. task_comments
create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- 9. task_attachments
create table if not exists task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 10. notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 11. activity_logs
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz default now()
);

-- Indexes for high performance
create index if not exists idx_tasks_org_status on tasks(org_id, status);
create index if not exists idx_tasks_org_due_date on tasks(org_id, due_date);
create index if not exists idx_notifications_user_read on notifications(user_id, read_at);
create index if not exists idx_activity_logs_org_created on activity_logs(org_id, created_at desc);
create index if not exists idx_profiles_org on profiles(org_id);
create index if not exists idx_teams_org on teams(org_id);
create index if not exists idx_team_members_user on team_members(user_id);
create index if not exists idx_task_assignees_user on task_assignees(user_id);
create index if not exists idx_task_comments_task on task_comments(task_id);
create index if not exists idx_task_attachments_task on task_attachments(task_id);
create index if not exists idx_task_dependencies_depends on task_dependencies(depends_on_task_id);

-- ==============================================================================
-- SECTION 2: SLACK & NOTIFICATIONS EXTENSIONS (0005 & 0006)
-- ==============================================================================

alter table if exists organizations
add column if not exists slack_webhook_url text,
add column if not exists slack_notifications_enabled boolean default true;

alter table if exists profiles
add column if not exists notification_preferences jsonb default '{
  "task_assigned": true,
  "task_mentioned": true,
  "task_due_soon": true,
  "task_overdue": true
}'::jsonb;

-- ==============================================================================
-- SECTION 3: SUBSCRIPTIONS & BILLING TABLE (0007_billing_scaffolding.sql)
-- ==============================================================================

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscriptions_org_id on subscriptions(org_id);
create index if not exists idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);
create index if not exists idx_subscriptions_stripe_sub on subscriptions(stripe_subscription_id);

-- ==============================================================================
-- SECTION 4: ROW-LEVEL SECURITY POLICIES (0002_rls.sql & 0008_fix_privilege_escalation.sql)
-- ==============================================================================

alter table organizations enable row level security;
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
alter table subscriptions enable row level security;

-- Organizations policies
drop policy if exists "organizations_select_policy" on organizations;
create policy "organizations_select_policy" on organizations for select
using (id = (auth.jwt() ->> 'org_id')::uuid);

drop policy if exists "organizations_update_policy" on organizations;
create policy "organizations_update_policy" on organizations for update
using (id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') = 'admin');

-- Profiles policies (with privilege escalation fix)
drop policy if exists "profiles_select_policy" on profiles;
create policy "profiles_select_policy" on profiles for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid or id = auth.uid());

drop policy if exists "profiles_insert_policy" on profiles;
create policy "profiles_insert_policy" on profiles for insert
with check (id = auth.uid() or (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') = 'admin'));

drop policy if exists "profiles_update_policy" on profiles;
drop policy if exists "profiles_self_update_policy" on profiles;
create policy "profiles_self_update_policy" on profiles for update
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from profiles p where p.id = auth.uid() limit 1)
  and org_id = (select p.org_id from profiles p where p.id = auth.uid() limit 1)
);

drop policy if exists "profiles_admin_update_policy" on profiles;
create policy "profiles_admin_update_policy" on profiles for update
using (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') = 'admin')
with check (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') = 'admin');

drop policy if exists "profiles_delete_policy" on profiles;
create policy "profiles_delete_policy" on profiles for delete
using (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') = 'admin');

-- Teams policies
drop policy if exists "teams_select_policy" on teams;
create policy "teams_select_policy" on teams for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

drop policy if exists "teams_insert_policy" on teams;
create policy "teams_insert_policy" on teams for insert
with check (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') in ('admin', 'manager'));

drop policy if exists "teams_update_policy" on teams;
create policy "teams_update_policy" on teams for update
using (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') in ('admin', 'manager'));

drop policy if exists "teams_delete_policy" on teams;
create policy "teams_delete_policy" on teams for delete
using (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') = 'admin');

-- Team members policies
drop policy if exists "team_members_select_policy" on team_members;
create policy "team_members_select_policy" on team_members for select
using (team_id in (select id from teams where org_id = (auth.jwt() ->> 'org_id')::uuid));

drop policy if exists "team_members_all_policy" on team_members;
create policy "team_members_all_policy" on team_members for all
using (team_id in (select id from teams where org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') in ('admin', 'manager')));

-- Tasks policies (CRITICAL TENANT ISOLATION)
drop policy if exists "tasks_select_policy" on tasks;
create policy "tasks_select_policy" on tasks for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

drop policy if exists "tasks_insert_policy" on tasks;
create policy "tasks_insert_policy" on tasks for insert
with check (org_id = (auth.jwt() ->> 'org_id')::uuid);

drop policy if exists "tasks_update_policy" on tasks;
create policy "tasks_update_policy" on tasks for update
using (org_id = (auth.jwt() ->> 'org_id')::uuid)
with check (org_id = (auth.jwt() ->> 'org_id')::uuid);

drop policy if exists "tasks_delete_policy" on tasks;
create policy "tasks_delete_policy" on tasks for delete
using (org_id = (auth.jwt() ->> 'org_id')::uuid and (auth.jwt() ->> 'role') in ('admin', 'manager'));

-- Task assignees policies
drop policy if exists "task_assignees_select_policy" on task_assignees;
create policy "task_assignees_select_policy" on task_assignees for select
using (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

drop policy if exists "task_assignees_all_policy" on task_assignees;
create policy "task_assignees_all_policy" on task_assignees for all
using (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

-- Task dependencies policies
drop policy if exists "task_dependencies_select_policy" on task_dependencies;
create policy "task_dependencies_select_policy" on task_dependencies for select
using (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

drop policy if exists "task_dependencies_all_policy" on task_dependencies;
create policy "task_dependencies_all_policy" on task_dependencies for all
using (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

-- Task comments policies
drop policy if exists "task_comments_select_policy" on task_comments;
create policy "task_comments_select_policy" on task_comments for select
using (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

drop policy if exists "task_comments_insert_policy" on task_comments;
create policy "task_comments_insert_policy" on task_comments for insert
with check (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

drop policy if exists "task_comments_delete_policy" on task_comments;
create policy "task_comments_delete_policy" on task_comments for delete
using (
  user_id = auth.uid()
  or (auth.jwt() ->> 'role') = 'admin'
);

-- Task attachments policies
drop policy if exists "task_attachments_select_policy" on task_attachments;
create policy "task_attachments_select_policy" on task_attachments for select
using (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

drop policy if exists "task_attachments_insert_policy" on task_attachments;
create policy "task_attachments_insert_policy" on task_attachments for insert
with check (task_id in (select id from tasks where org_id = (auth.jwt() ->> 'org_id')::uuid));

drop policy if exists "task_attachments_delete_policy" on task_attachments;
create policy "task_attachments_delete_policy" on task_attachments for delete
using (
  uploaded_by = auth.uid()
  or (auth.jwt() ->> 'role') = 'admin'
);

-- Notifications policies
drop policy if exists "notifications_select_policy" on notifications;
create policy "notifications_select_policy" on notifications for select
using (user_id = auth.uid());

drop policy if exists "notifications_update_policy" on notifications;
create policy "notifications_update_policy" on notifications for update
using (user_id = auth.uid());

-- Activity logs policies
drop policy if exists "activity_logs_select_policy" on activity_logs;
create policy "activity_logs_select_policy" on activity_logs for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

drop policy if exists "activity_logs_insert_policy" on activity_logs;
create policy "activity_logs_insert_policy" on activity_logs for insert
with check (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Subscriptions policies
drop policy if exists "subscriptions_select_policy" on subscriptions;
create policy "subscriptions_select_policy" on subscriptions for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

drop policy if exists "subscriptions_service_insert" on subscriptions;
create policy "subscriptions_service_insert" on subscriptions for insert
with check (true);

drop policy if exists "subscriptions_service_update" on subscriptions;
create policy "subscriptions_service_update" on subscriptions for update
using (true)
with check (true);

-- ==============================================================================
-- SECTION 5: CUSTOM JWT AUTH HOOK (0003_auth_hook.sql)
-- ==============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_org_id uuid;
  user_role text;
  target_user_id uuid;
begin
  claims := event->'claims';
  target_user_id := (event->>'user_id')::uuid;

  select org_id, role
  into user_org_id, user_role
  from public.profiles
  where id = target_user_id;

  if user_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id::text));
  end if;

  if user_role is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{role}', to_jsonb('employee'::text));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;

-- ==============================================================================
-- SECTION 6: ATOMIC SIGNUP TRANSACTION RPC (0004_signup_rpc.sql)
-- ==============================================================================

create or replace function public.signup_organization_admin(
  p_org_name text,
  p_user_id uuid,
  p_full_name text,
  p_timezone text default 'Asia/Kolkata'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  insert into public.organizations (name, timezone)
  values (p_org_name, coalesce(p_timezone, 'Asia/Kolkata'))
  returning id into v_org_id;

  insert into public.profiles (id, org_id, full_name, role)
  values (p_user_id, v_org_id, p_full_name, 'admin')
  on conflict (id) do update
  set org_id = v_org_id,
      full_name = coalesce(p_full_name, profiles.full_name),
      role = 'admin';

  insert into public.activity_logs (org_id, actor_id, action, entity, entity_id, diff)
  values (
    v_org_id,
    p_user_id,
    'org.created',
    'organizations',
    v_org_id,
    jsonb_build_object('org_name', p_org_name, 'admin_name', p_full_name)
  );

  return jsonb_build_object(
    'org_id', v_org_id,
    'user_id', p_user_id,
    'role', 'admin',
    'org_name', p_org_name
  );
end;
$$;

grant execute on function public.signup_organization_admin(text, uuid, text, text) to authenticated, service_role, anon;

-- ==============================================================================
-- SECTION 7: NOTIFICATION TRIGGERS (0005_notifications.sql)
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
  select title, org_id, created_by into v_task from tasks where id = new.task_id;
  select full_name into v_actor_name from profiles where id = auth.uid();

  insert into notifications (user_id, type, payload, created_at)
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

drop trigger if exists tr_notify_task_assigned on task_assignees;
create trigger tr_notify_task_assigned
after insert on task_assignees
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
  select title into v_task_title from tasks where id = new.task_id;
  select full_name into v_author_name from profiles where id = new.user_id;

  for v_mentioned_user in
    select id, full_name
    from profiles
    where new.body ~* ('@' || full_name)
      and id <> new.user_id
  loop
    insert into notifications (user_id, type, payload, created_at)
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

drop trigger if exists tr_notify_comment_mention on task_comments;
create trigger tr_notify_comment_mention
after insert on task_comments
for each row
execute function notify_on_comment_mention();

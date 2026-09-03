-- ==============================================================================
-- TASQ-ONE: MASTER ALL-IN-ONE DATABASE SCHEMA & SEED SCRIPT
-- FILE: supabase/database.sql
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/aifmumudpbnovfyslwuj
-- 2. Go to SQL Editor -> New Query.
-- 3. Paste this ENTIRE file and click "RUN".
--
-- WHAT THIS SCRIPT DOES:
-- - Safe for existing databases: Keeps existing users/data intact (uses IF NOT EXISTS).
-- - Creates all tables, columns, foreign keys, and performance indexes.
-- - Sets up bulletproof auth triggers (handle_new_user) and signup RPC functions.
-- - Configures clean, non-recursive PostgreSQL Row-Level Security (RLS) policies.
-- - Enables Realtime live Kanban drag-and-drop sync.
-- - Seeds realistic starter tasks, teams, assignees, comments, and activity logs
--   linked to your existing Admin, Manager, and Employee profiles!
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Ensure Supabase Roles exist (required for fresh/CI Postgres, harmless no-op on Supabase Cloud)
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end $$;

-- CI / Local Postgres Auth Schema compatibility (harmless on Supabase Cloud)
do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    create schema auth;
  end if;

  if not exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text unique,
      raw_user_meta_data jsonb default '{}'::jsonb,
      raw_app_meta_data jsonb default '{}'::jsonb,
      created_at timestamptz default now()
    );
  end if;

  if not exists (select 1 from pg_proc join pg_namespace on pg_proc.pronamespace = pg_namespace.oid where pg_namespace.nspname = 'auth' and proname = 'uid') then
    create function auth.uid() returns uuid as $f$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $f$ language sql stable;
  end if;

  if not exists (select 1 from pg_proc join pg_namespace on pg_proc.pronamespace = pg_namespace.oid where pg_namespace.nspname = 'auth' and proname = 'role') then
    create function auth.role() returns text as $f$
      select nullif(current_setting('request.jwt.claim.role', true), '')::text;
    $f$ language sql stable;
  end if;

  if not exists (select 1 from pg_proc join pg_namespace on pg_proc.pronamespace = pg_namespace.oid where pg_namespace.nspname = 'auth' and proname = 'jwt') then
    create function auth.jwt() returns jsonb as $f$
      select coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb,
        jsonb_build_object(
          'sub', current_setting('request.jwt.claim.sub', true),
          'role', current_setting('request.jwt.claim.role', true),
          'org_id', current_setting('request.jwt.claim.org_id', true)
        )
      );
    $f$ language sql stable;
  end if;
exception
  when insufficient_privilege then
    -- On Supabase Cloud, auth schema & functions are pre-created and managed by Supabase
    null;
end $$;

-- ==============================================================================
-- 2. CORE DATABASE TABLES
-- ==============================================================================

-- 2.1 Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid,
  timezone text default 'Asia/Kolkata',
  slack_webhook_url text,
  slack_notifications_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.2 Profiles (Linked to auth.users and organizations)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  full_name text not null,
  role text check (role in ('admin', 'manager', 'employee')) default 'employee',
  avatar_url text,
  notification_preferences jsonb default '{"email": true, "in_app": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Ensure deleted_at column exists if table was created previously
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.profiles add column if not exists notification_preferences jsonb default '{"email": true, "in_app": true}'::jsonb;
alter table public.organizations add column if not exists slack_webhook_url text;
alter table public.organizations add column if not exists slack_notifications_enabled boolean default true;

-- Safe foreign key from organizations.created_by to profiles.id
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organizations_created_by_fkey'
  ) then
    alter table public.organizations
    add constraint organizations_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;
  end if;
exception
  when others then null;
end;
$$;

-- 2.3 Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  manager_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure all columns exist on pre-existing teams table
alter table public.teams add column if not exists manager_id uuid references public.profiles(id) on delete set null;

-- 2.4 Team Members
create table if not exists public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

-- 2.5 Tasks
create table if not exists public.tasks (
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

-- Ensure all columns exist on pre-existing tasks table
alter table public.tasks add column if not exists team_id uuid references public.teams(id) on delete set null;
alter table public.tasks add column if not exists priority text default 'medium';
alter table public.tasks add column if not exists due_date timestamptz;
alter table public.tasks add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists updated_at timestamptz default now();

-- 2.6 Task Assignees (Many-to-Many)
create table if not exists public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

-- 2.7 Task Dependencies
create table if not exists public.task_dependencies (
  task_id uuid references public.tasks(id) on delete cascade,
  depends_on_task_id uuid references public.tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id)
);

-- 2.8 Task Subtasks
create table if not exists public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

-- 2.9 Task Comments
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- 2.10 Task Attachments (Repo URLs, Docs, Figma links)
create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 2.11 Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Ensure read_at exists on pre-existing notifications table
alter table public.notifications add column if not exists read_at timestamptz;

-- 2.12 Activity / Audit Logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz default now()
);

-- 2.13 Slack Integrations (Optional)
create table if not exists public.slack_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  webhook_url text not null,
  channel text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2.14 Subscriptions (Optional Billing)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================
create index if not exists idx_profiles_org on public.profiles(org_id);
create index if not exists idx_profiles_active on public.profiles(org_id) where deleted_at is null;
create index if not exists idx_teams_org on public.teams(org_id);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_tasks_org_status on public.tasks(org_id, status);
create index if not exists idx_tasks_org_due_date on public.tasks(org_id, due_date);
create index if not exists idx_task_assignees_user on public.task_assignees(user_id);
create index if not exists idx_task_comments_task on public.task_comments(task_id);
create index if not exists idx_task_attachments_task on public.task_attachments(task_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read_at);
create index if not exists idx_activity_logs_org_created on public.activity_logs(org_id, created_at desc);

-- Realtime delete emission for live Kanban sync
alter table if exists public.tasks replica identity full;

-- ==============================================================================
-- 4. BULLETPROOF AUTH TRIGGERS & RPC
-- ==============================================================================

-- 4.1 Auto create Profile and Org on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text;
  v_full_name text;
  v_role text;
  v_raw_org text;
begin
  v_org_name := coalesce(
    new.raw_user_meta_data->>'org_name',
    new.raw_app_meta_data->>'org_name',
    'Revonza Studio'
  );
  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_app_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  v_role := coalesce(
    new.raw_app_meta_data->>'role',
    new.raw_user_meta_data->>'role',
    'admin'
  );
  if v_role not in ('admin', 'manager', 'employee') then
    v_role := 'employee';
  end if;

  v_raw_org := coalesce(new.raw_app_meta_data->>'org_id', new.raw_user_meta_data->>'org_id');
  if v_raw_org is not null and v_raw_org ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    if exists (select 1 from public.organizations where id = v_raw_org::uuid) then
      v_org_id := v_raw_org::uuid;
    end if;
  end if;

  if v_org_id is null then
    select id into v_org_id from public.organizations where created_by = new.id limit 1;
    if v_org_id is null then
      select id into v_org_id from public.organizations limit 1;
      if v_org_id is null then
        insert into public.organizations (name, timezone)
        values (v_org_name, 'Asia/Kolkata')
        returning id into v_org_id;
      end if;
    end if;
  end if;

  insert into public.profiles (id, org_id, full_name, role, created_at)
  values (new.id, v_org_id, v_full_name, v_role, now())
  on conflict (id) do update set
    org_id = coalesce(public.profiles.org_id, excluded.org_id),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = coalesce(public.profiles.role, excluded.role);

  update public.organizations 
  set created_by = new.id 
  where id = v_org_id and created_by is null;

  return new;
exception
  when others then
    return new;
end;
$$;

do $$
begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
exception
  when others then null;
end $$;

-- 4.2 Dedicated Atomic Signup RPC
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
  insert into public.organizations (name, timezone, created_by)
  values (p_org_name, coalesce(p_timezone, 'Asia/Kolkata'), p_user_id)
  returning id into v_org_id;

  insert into public.profiles (id, org_id, full_name, role)
  values (p_user_id, v_org_id, p_full_name, 'admin')
  on conflict (id) do update set
    org_id = excluded.org_id,
    full_name = excluded.full_name,
    role = 'admin';

  insert into public.teams (org_id, name)
  values (v_org_id, 'Engineering & Product');

  return jsonb_build_object('org_id', v_org_id, 'user_id', p_user_id);
end;
$$;

-- 4.3 Custom Access Token Hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_role text;
  user_org_id uuid;
begin
  select role, org_id into user_role, user_org_id
  from public.profiles
  where id = (event->>'user_id')::uuid and deleted_at is null;

  claims := event->'claims';

  -- Preserve standard PostgreSQL 'role' ('authenticated') so PostgREST does not fail.
  -- Store application user role into 'user_role' and 'app_metadata'
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    if (claims ? 'app_metadata') then
      claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));
    end if;
  end if;

  if user_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id));
    if (claims ? 'app_metadata') then
      claims := jsonb_set(claims, '{app_metadata,org_id}', to_jsonb(user_org_id));
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- 4.4 PostgreSQL Role Aliases for Backward Compatibility
-- Prevents "role admin/employee/manager does not exist" for any existing JWTs
do $$
begin
  if not exists (select from pg_roles where rolname = 'admin') then
    create role admin inherit in role authenticated;
  end if;
  if not exists (select from pg_roles where rolname = 'manager') then
    create role manager inherit in role authenticated;
  end if;
  if not exists (select from pg_roles where rolname = 'employee') then
    create role employee inherit in role authenticated;
  end if;
exception
  when others then null;
end $$;

grant anon, authenticated, service_role to admin, manager, employee;
grant admin, manager, employee to authenticator;
grant all on all tables in schema public to admin, manager, employee;
grant all on all sequences in schema public to admin, manager, employee;
grant all on all routines in schema public to admin, manager, employee;

-- ==============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- ==============================================================================

-- 5.1 Helper functions (SECURITY DEFINER to prevent infinite recursion)
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'org_id')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'org_id')::uuid,
    (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null limit 1)
  );
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.user_role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'user_role'),
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role'),
    (select p.role from public.profiles p where p.id = auth.uid() and p.deleted_at is null limit 1),
    'employee'
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- Organizations RLS
drop policy if exists "organizations_select_policy" on public.organizations;
drop policy if exists "Users can view their organization" on public.organizations;
create policy "organizations_select_policy"
on public.organizations for select to authenticated
using (
  id = public.current_org_id()
  or created_by = auth.uid()
);

drop policy if exists "organizations_update_policy" on public.organizations;
drop policy if exists "Admins can update their organization" on public.organizations;
create policy "organizations_update_policy"
on public.organizations for update to authenticated
using (
  (id = public.current_org_id() or created_by = auth.uid())
  and public.current_role() = 'admin'
);

-- Profiles RLS (Completely non-recursive)
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "Users can read profiles in their workspace" on public.profiles;
create policy "profiles_select_policy"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or org_id = public.current_org_id()
);

drop policy if exists "profiles_insert_policy" on public.profiles;
drop policy if exists "Admins can insert profiles in their workspace" on public.profiles;
create policy "profiles_insert_policy"
on public.profiles for insert to authenticated
with check (
  id = auth.uid()
  or (
    org_id = public.current_org_id()
    and public.current_role() = 'admin'
  )
);

drop policy if exists "profiles_update_policy" on public.profiles;
drop policy if exists "Users can update own profile or admins can update org profiles" on public.profiles;
create policy "profiles_update_policy"
on public.profiles for update to authenticated
using (
  id = auth.uid()
  or (
    org_id = public.current_org_id()
    and public.current_role() = 'admin'
  )
)
with check (
  id = auth.uid()
  or (
    org_id = public.current_org_id()
    and public.current_role() = 'admin'
  )
);

drop policy if exists "profiles_delete_policy" on public.profiles;
create policy "profiles_delete_policy"
on public.profiles for delete to authenticated
using (
  org_id = public.current_org_id()
  and public.current_role() = 'admin'
);

-- Teams RLS
drop policy if exists "teams_select_policy" on public.teams;
drop policy if exists "Users can view teams in their org" on public.teams;
create policy "teams_select_policy"
on public.teams for select to authenticated
using (org_id = public.current_org_id());

drop policy if exists "teams_insert_policy" on public.teams;
create policy "teams_insert_policy"
on public.teams for insert to authenticated
with check (
  org_id = public.current_org_id()
  and public.current_role() in ('admin', 'manager', 'authenticated')
);

drop policy if exists "teams_update_policy" on public.teams;
drop policy if exists "Admins and managers can manage teams" on public.teams;
create policy "teams_update_policy"
on public.teams for update to authenticated
using (
  org_id = public.current_org_id()
  and public.current_role() in ('admin', 'manager', 'authenticated')
);

drop policy if exists "teams_delete_policy" on public.teams;
create policy "teams_delete_policy"
on public.teams for delete to authenticated
using (
  org_id = public.current_org_id()
  and public.current_role() in ('admin', 'authenticated')
);

-- Team Members RLS
drop policy if exists "team_members_select_policy" on public.team_members;
drop policy if exists "Users can view team members in their org" on public.team_members;
create policy "team_members_select_policy"
on public.team_members for select to authenticated
using (
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
    and t.org_id = public.current_org_id()
  )
);

drop policy if exists "team_members_insert_policy" on public.team_members;
create policy "team_members_insert_policy"
on public.team_members for insert to authenticated
with check (
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
    and t.org_id = public.current_org_id()
  )
);

drop policy if exists "team_members_delete_policy" on public.team_members;
create policy "team_members_delete_policy"
on public.team_members for delete to authenticated
using (
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
    and t.org_id = public.current_org_id()
  )
);

-- Tasks RLS
drop policy if exists "tasks_select_policy" on public.tasks;
drop policy if exists "Users can view tasks in their org" on public.tasks;
create policy "tasks_select_policy"
on public.tasks for select to authenticated
using (org_id = public.current_org_id());

drop policy if exists "tasks_insert_policy" on public.tasks;
drop policy if exists "Users can insert tasks in their org" on public.tasks;
create policy "tasks_insert_policy"
on public.tasks for insert to authenticated
with check (
  org_id = public.current_org_id()
);

drop policy if exists "tasks_update_policy" on public.tasks;
drop policy if exists "Users can update tasks in their org" on public.tasks;
create policy "tasks_update_policy"
on public.tasks for update to authenticated
using (
  org_id = public.current_org_id()
);

drop policy if exists "tasks_delete_policy" on public.tasks;
drop policy if exists "Users can delete tasks in their org" on public.tasks;
create policy "tasks_delete_policy"
on public.tasks for delete to authenticated
using (
  org_id = public.current_org_id()
  and public.current_role() in ('admin', 'manager', 'authenticated')
);

-- Task Assignees RLS
drop policy if exists "task_assignees_select_policy" on public.task_assignees;
drop policy if exists "Users can view task assignees in their org" on public.task_assignees;
create policy "task_assignees_select_policy"
on public.task_assignees for select to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_assignees.task_id
    and t.org_id = public.current_org_id()
  )
);

drop policy if exists "task_assignees_all_policy" on public.task_assignees;
drop policy if exists "Users can manage task assignees in their org" on public.task_assignees;
create policy "task_assignees_all_policy"
on public.task_assignees for all to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_assignees.task_id
    and t.org_id = public.current_org_id()
  )
);

-- Task Subtasks, Comments & Attachments RLS
drop policy if exists "task_subtasks_policy" on public.task_subtasks;
drop policy if exists "Users can view subtasks in their org" on public.task_subtasks;
create policy "task_subtasks_policy"
on public.task_subtasks for all to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_subtasks.task_id
    and t.org_id = public.current_org_id()
  )
);

drop policy if exists "task_comments_policy" on public.task_comments;
drop policy if exists "Users can view comments in their org" on public.task_comments;
create policy "task_comments_policy"
on public.task_comments for all to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_comments.task_id
    and t.org_id = public.current_org_id()
  )
);

drop policy if exists "task_attachments_policy" on public.task_attachments;
drop policy if exists "Users can view attachments in their org" on public.task_attachments;
create policy "task_attachments_policy"
on public.task_attachments for all to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_attachments.task_id
    and t.org_id = public.current_org_id()
  )
);

-- Activity Logs & Notifications RLS
drop policy if exists "activity_logs_policy" on public.activity_logs;
drop policy if exists "Users can view activity logs in their org" on public.activity_logs;
create policy "activity_logs_policy"
on public.activity_logs for select to authenticated
using (
  org_id = public.current_org_id()
);

drop policy if exists "activity_logs_insert_policy" on public.activity_logs;
create policy "activity_logs_insert_policy"
on public.activity_logs for insert to authenticated
with check (
  org_id = public.current_org_id()
);

drop policy if exists "notifications_policy" on public.notifications;
drop policy if exists "Users can view their notifications" on public.notifications;
create policy "notifications_policy"
on public.notifications for all to authenticated
using (user_id = auth.uid());

-- ==============================================================================
-- 6. SMART WORKSPACE DATA SEED (FOR EXISTING & NEW PROFILES)
-- ==============================================================================
do $$
declare
  r_org record;
  v_admin_id uuid;
  v_manager_id uuid;
  v_employee_id uuid;
  v_team_eng_id uuid;
  v_team_ops_id uuid;
  v_task_id uuid;
  v_now timestamptz := now();
begin
  -- A. Ensure at least one primary organization exists
  if not exists (select 1 from public.organizations) then
    insert into public.organizations (name, timezone)
    values ('Revonza Studio', 'Asia/Kolkata');
  end if;

  -- B. Auto-heal any profiles that have null org_id by attaching them to the primary organization
  update public.profiles
  set org_id = (select id from public.organizations order by created_at asc limit 1)
  where org_id is null;

  -- Loop through all existing organizations
  for r_org in (select id from public.organizations) loop
    -- 1. Identify existing users by role in this organization
    select id into v_admin_id from public.profiles 
    where org_id = r_org.id and role = 'admin' and deleted_at is null
    order by created_at asc limit 1;

    select id into v_manager_id from public.profiles 
    where org_id = r_org.id and role = 'manager' and deleted_at is null
    order by created_at asc limit 1;

    select id into v_employee_id from public.profiles 
    where org_id = r_org.id and role = 'employee' and deleted_at is null
    order by created_at asc limit 1;

    -- Fallback if no specific role found
    if v_admin_id is null then
      select id into v_admin_id from public.profiles where org_id = r_org.id limit 1;
    end if;
    if v_manager_id is null then
      v_manager_id := v_admin_id;
    end if;
    if v_employee_id is null then
      v_employee_id := v_admin_id;
    end if;

    -- 2. Ensure Teams exist and link Manager
    select id into v_team_eng_id from public.teams where org_id = r_org.id and name = 'Engineering & Product' limit 1;
    if v_team_eng_id is null then
      insert into public.teams (org_id, name, manager_id)
      values (r_org.id, 'Engineering & Product', v_manager_id)
      returning id into v_team_eng_id;
    end if;

    select id into v_team_ops_id from public.teams where org_id = r_org.id and name = 'Operations & Growth' limit 1;
    if v_team_ops_id is null then
      insert into public.teams (org_id, name, manager_id)
      values (r_org.id, 'Operations & Growth', v_manager_id)
      returning id into v_team_ops_id;
    end if;

    -- 3. Ensure Team Memberships exist
    if v_manager_id is not null and v_team_eng_id is not null then
      insert into public.team_members (team_id, user_id) values (v_team_eng_id, v_manager_id) on conflict do nothing;
    end if;
    if v_employee_id is not null and v_team_eng_id is not null then
      insert into public.team_members (team_id, user_id) values (v_team_eng_id, v_employee_id) on conflict do nothing;
    end if;

    -- 4. Clean out old empty state & Seed 6 rich tasks across all 4 statuses
    -- Only seed if organization currently has 0 tasks
    if not exists (select 1 from public.tasks where org_id = r_org.id) then
      -- Task 1: [Completed] Initialize TASQ-ONE
      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_eng_id,
        'Initialize TASQ-ONE Work OS workspace',
        'Configured organization profiles, database schemas, role permissions, and active teams.',
        'completed',
        'low',
        v_now - interval '1 day',
        v_admin_id,
        v_now - interval '4 days',
        v_now - interval '1 day'
      ) returning id into v_task_id;
      if v_admin_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_admin_id) on conflict do nothing;
      end if;

      -- Task 2: [In Progress] Connect repository URLs (Assigned to Employee)
      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_eng_id,
        'Connect repository URLs & project resources',
        'Attach GitHub repository links, Figma files, and documentation URLs directly to tasks.',
        'in_progress',
        'urgent',
        v_now + interval '1 day',
        v_manager_id,
        v_now - interval '2 days',
        v_now
      ) returning id into v_task_id;
      if v_employee_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_employee_id) on conflict do nothing;
      end if;
      insert into public.task_subtasks (task_id, title, completed) values 
        (v_task_id, 'Link GitHub repo URL', true),
        (v_task_id, 'Add architecture design docs', false);

      -- Task 3: [In Progress] Review sprint milestones (Assigned to Manager)
      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_eng_id,
        'Review sprint milestones & workload delegation',
        'Organize pending backlog items, estimate delivery velocity, and align priorities with team leads.',
        'in_progress',
        'high',
        v_now + interval '2 days',
        v_admin_id,
        v_now - interval '1 day',
        v_now
      ) returning id into v_task_id;
      if v_manager_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_manager_id) on conflict do nothing;
      end if;

      -- Task 4: [In Review] Verify workspace security & access controls
      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_ops_id,
        'Verify workspace security & notification settings',
        'Audit multi-tenant row-level access controls and configure Slack notification channels.',
        'in_review',
        'medium',
        v_now + interval '3 days',
        v_admin_id,
        v_now - interval '3 days',
        v_now
      ) returning id into v_task_id;
      if v_admin_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_admin_id) on conflict do nothing;
      end if;

      -- Task 5: [Pending] Invite team members
      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_ops_id,
        'Invite team members & assign department roles',
        'Send email invites or magic links to team leads and employees for sprint collaboration.',
        'pending',
        'high',
        v_now + interval '5 days',
        v_admin_id,
        v_now,
        v_now
      ) returning id into v_task_id;
      if v_admin_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_admin_id) on conflict do nothing;
      end if;

      -- Task 6: [Pending] Explore AI workload suggestions (Assigned to Employee)
      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_eng_id,
        'Explore AI workload suggestions & task optimizer',
        'Test Groq Llama 3 AI suggestions for subtask generation and workload rebalancing.',
        'pending',
        'medium',
        v_now + interval '7 days',
        v_manager_id,
        v_now,
        v_now
      ) returning id into v_task_id;
      if v_employee_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_employee_id) on conflict do nothing;
      end if;

      -- Sample comments & initial activity
      insert into public.task_comments (task_id, user_id, body)
      values (v_task_id, v_admin_id, 'Welcome to TASQ-ONE! Feel free to edit or drag this task across Kanban columns.');

      insert into public.activity_logs (org_id, actor_id, action, entity, entity_id, diff)
      values (r_org.id, v_admin_id, 'workspace.seeded', 'tasks', v_task_id, '{"message": "Workspace initialized with 6 sample tasks."}'::jsonb);
    end if;
  end loop;
end;
$$;

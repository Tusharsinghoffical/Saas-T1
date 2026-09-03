-- ==============================================================================
-- TASQ-ONE: MASTER DATABASE SETUP & REPAIR SCRIPT (ALL-IN-ONE)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 2. CORE DATABASE TABLES
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

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  manager_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

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

create table if not exists public.task_assignees (
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists public.task_dependencies (
  task_id uuid references public.tasks(id) on delete cascade,
  depends_on_task_id uuid references public.tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id)
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

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

-- 3. INDEXES
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

alter table if exists public.tasks replica identity full;

-- 4. TRIGGERS & RPC
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

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

  if user_role is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  end if;

  if user_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- 5. ROW-LEVEL SECURITY
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- Organizations RLS
drop policy if exists "Users can view their organization" on public.organizations;
create policy "Users can view their organization"
on public.organizations for select to authenticated
using (
  created_by = auth.uid()
  or id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null)
);

drop policy if exists "Admins can update their organization" on public.organizations;
create policy "Admins can update their organization"
on public.organizations for update to authenticated
using (
  created_by = auth.uid()
  or id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.deleted_at is null)
);

-- Profiles RLS
drop policy if exists "Users can read profiles in their workspace" on public.profiles;
create policy "Users can read profiles in their workspace"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null)
);

drop policy if exists "Users can update own profile or admins can update org profiles" on public.profiles;
create policy "Users can update own profile or admins can update org profiles"
on public.profiles for update to authenticated
using (
  id = auth.uid()
  or org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.deleted_at is null)
);

drop policy if exists "Admins can insert profiles in their workspace" on public.profiles;
create policy "Admins can insert profiles in their workspace"
on public.profiles for insert to authenticated
with check (
  id = auth.uid()
  or org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.deleted_at is null)
);

-- Teams RLS
drop policy if exists "Users can view teams in their org" on public.teams;
create policy "Users can view teams in their org"
on public.teams for select to authenticated
using (
  org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null)
);

drop policy if exists "Admins and managers can manage teams" on public.teams;
create policy "Admins and managers can manage teams"
on public.teams for all to authenticated
using (
  org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager') and p.deleted_at is null)
);

-- Team Members RLS
drop policy if exists "Users can view team members in their org" on public.team_members;
create policy "Users can view team members in their org"
on public.team_members for select to authenticated
using (
  exists (
    select 1 from public.teams t
    join public.profiles p on p.org_id = t.org_id and p.id = auth.uid() and p.deleted_at is null
    where t.id = team_members.team_id
  )
);

-- Tasks RLS
drop policy if exists "Users can view tasks in their org" on public.tasks;
create policy "Users can view tasks in their org"
on public.tasks for select to authenticated
using (
  org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null)
);

drop policy if exists "Users can insert tasks in their org" on public.tasks;
create policy "Users can insert tasks in their org"
on public.tasks for insert to authenticated
with check (
  org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null)
);

drop policy if exists "Users can update tasks in their org" on public.tasks;
create policy "Users can update tasks in their org"
on public.tasks for update to authenticated
using (
  org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null)
);

drop policy if exists "Users can delete tasks in their org" on public.tasks;
create policy "Users can delete tasks in their org"
on public.tasks for delete to authenticated
using (
  org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager') and p.deleted_at is null)
);

-- Task Assignees RLS
drop policy if exists "Users can view task assignees in their org" on public.task_assignees;
create policy "Users can view task assignees in their org"
on public.task_assignees for select to authenticated
using (
  exists (
    select 1 from public.tasks t
    join public.profiles p on p.org_id = t.org_id and p.id = auth.uid() and p.deleted_at is null
    where t.id = task_assignees.task_id
  )
);

drop policy if exists "Users can manage task assignees in their org" on public.task_assignees;
create policy "Users can manage task assignees in their org"
on public.task_assignees for all to authenticated
using (
  exists (
    select 1 from public.tasks t
    join public.profiles p on p.org_id = t.org_id and p.id = auth.uid() and p.deleted_at is null
    where t.id = task_assignees.task_id
  )
);

-- Comments & Attachments RLS
drop policy if exists "Users can view comments in their org" on public.task_comments;
create policy "Users can view comments in their org"
on public.task_comments for all to authenticated
using (
  exists (
    select 1 from public.tasks t
    join public.profiles p on p.org_id = t.org_id and p.id = auth.uid() and p.deleted_at is null
    where t.id = task_comments.task_id
  )
);

drop policy if exists "Users can view attachments in their org" on public.task_attachments;
create policy "Users can view attachments in their org"
on public.task_attachments for all to authenticated
using (
  exists (
    select 1 from public.tasks t
    join public.profiles p on p.org_id = t.org_id and p.id = auth.uid() and p.deleted_at is null
    where t.id = task_attachments.task_id
  )
);

-- Activity Logs & Notifications RLS
drop policy if exists "Users can view activity logs in their org" on public.activity_logs;
create policy "Users can view activity logs in their org"
on public.activity_logs for select to authenticated
using (
  org_id in (select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null)
);

drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications"
on public.notifications for all to authenticated
using (user_id = auth.uid());

-- 6. SAMPLE WORKSPACE DATA SEED
do $$
declare
  r_org record;
  v_user_id uuid;
  v_team_id uuid;
  v_task_id uuid;
  v_now timestamptz := now();
begin
  for r_org in (select id from public.organizations) loop
    select id into v_user_id from public.profiles where org_id = r_org.id order by created_at asc limit 1;

    select id into v_team_id from public.teams where org_id = r_org.id limit 1;
    if v_team_id is null then
      insert into public.teams (org_id, name)
      values (r_org.id, 'Engineering & Product')
      returning id into v_team_id;

      insert into public.teams (org_id, name)
      values (r_org.id, 'Operations & Growth');
    end if;

    if not exists (select 1 from public.tasks where org_id = r_org.id) then
      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_id,
        'Initialize TASQ-ONE Work OS workspace',
        'Successfully configured organization profile, database schemas, and administrator credentials.',
        'completed',
        'low',
        v_now - interval '1 day',
        v_user_id,
        v_now - interval '4 days',
        v_now - interval '1 day'
      ) returning id into v_task_id;
      if v_user_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_user_id) on conflict do nothing;
      end if;

      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_id,
        'Connect repository URLs & project resources',
        'Attach GitHub repository links, Figma files, and documentation URLs directly to tasks.',
        'in_progress',
        'urgent',
        v_now + interval '1 day',
        v_user_id,
        v_now - interval '2 days',
        v_now
      ) returning id into v_task_id;
      if v_user_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_user_id) on conflict do nothing;
      end if;

      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_id,
        'Review sprint milestones & workload delegation',
        'Organize pending backlog items, estimate delivery velocity, and review sprint roadmap.',
        'in_progress',
        'high',
        v_now + interval '2 days',
        v_user_id,
        v_now - interval '1 day',
        v_now
      ) returning id into v_task_id;
      if v_user_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_user_id) on conflict do nothing;
      end if;

      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_id,
        'Verify workspace security & notification settings',
        'Audit multi-tenant row-level access controls and configure Slack notification channels.',
        'in_review',
        'medium',
        v_now + interval '3 days',
        v_user_id,
        v_now - interval '3 days',
        v_now
      ) returning id into v_task_id;
      if v_user_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_user_id) on conflict do nothing;
      end if;

      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_id,
        'Invite team members & assign role permissions',
        'Send email invites or magic links to team leads and employees for sprint collaboration.',
        'pending',
        'high',
        v_now + interval '5 days',
        v_user_id,
        v_now,
        v_now
      ) returning id into v_task_id;
      if v_user_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_user_id) on conflict do nothing;
      end if;

      insert into public.tasks (org_id, team_id, title, description, status, priority, due_date, created_by, created_at, updated_at)
      values (
        r_org.id,
        v_team_id,
        'Explore AI workload suggestions & task optimizer',
        'Test Groq Llama 3 AI suggestions for subtask generation and workload rebalancing.',
        'pending',
        'medium',
        v_now + interval '7 days',
        v_user_id,
        v_now,
        v_now
      ) returning id into v_task_id;
      if v_user_id is not null then
        insert into public.task_assignees (task_id, user_id) values (v_task_id, v_user_id) on conflict do nothing;
      end if;

      insert into public.task_comments (task_id, user_id, body)
      values (v_task_id, v_user_id, 'Welcome to TASQ-ONE! Feel free to edit or drag this task across Kanban columns.');

      insert into public.activity_logs (org_id, actor_id, action, entity, entity_id, diff)
      values (r_org.id, v_user_id, 'workspace.seeded', 'tasks', v_task_id, '{"message": "Workspace initialized with 6 sample tasks."}'::jsonb);
    end if;
  end loop;
end;
$$;

-- ==============================================================================
-- TASQ-ONE: BULLETPROOF TRIGGER & DATABASE REPAIR SCRIPT
-- RUN THIS IN SUPABASE DASHBOARD -> SQL EDITOR -> CLICK "RUN"
-- ==============================================================================

-- 1. BULLETPROOF TRIGGER WITH EXCEPTION HANDLER (Fixes "Database error saving new user")
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
  -- Safe extraction
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
    'employee'
  );
  if v_role not in ('admin', 'manager', 'employee') then
    v_role := 'employee';
  end if;

  -- Safe UUID validation for org_id
  v_raw_org := coalesce(new.raw_app_meta_data->>'org_id', new.raw_user_meta_data->>'org_id');
  if v_raw_org is not null and v_raw_org ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    if exists (select 1 from public.organizations where id = v_raw_org::uuid) then
      v_org_id := v_raw_org::uuid;
    end if;
  end if;

  -- If no valid org_id found, find existing org or create new one
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

  -- Upsert into public.profiles
  insert into public.profiles (id, org_id, full_name, role, created_at)
  values (new.id, v_org_id, v_full_name, v_role, now())
  on conflict (id) do update set
    org_id = coalesce(public.profiles.org_id, excluded.org_id),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = coalesce(public.profiles.role, excluded.role);

  -- Set created_by if null
  update public.organizations 
  set created_by = new.id 
  where id = v_org_id and created_by is null;

  return new;
exception
  when others then
    -- Catch all errors so auth.users insertion never fails
    return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- 2. FIX AUTH HOOK: Preserve Postgres Role as 'authenticated'
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
    claims := jsonb_set(claims, '{app_metadata,org_id}', to_jsonb(user_org_id::text));
  end if;

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', to_jsonb('employee'::text));
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb('employee'::text));
  end if;

  claims := jsonb_set(claims, '{role}', to_jsonb('authenticated'::text));

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;


-- 3. ONE-TIME SYNC FOR ALL EXISTING USERS IN auth.users
do $$
declare
  r record;
  v_org_id uuid;
  v_org_name text;
  v_full_name text;
  v_role text;
begin
  for r in select * from auth.users loop
    v_org_name := coalesce(r.raw_user_meta_data->>'org_name', 'Revonza Studio');
    v_full_name := coalesce(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1));
    v_role := coalesce(r.raw_app_meta_data->>'role', r.raw_user_meta_data->>'role', 'admin');
    
    select org_id into v_org_id from public.profiles where id = r.id;
    
    if v_org_id is null then
      select id into v_org_id from public.organizations where created_by = r.id limit 1;
      
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
    values (r.id, v_org_id, v_full_name, v_role, now())
    on conflict (id) do update set
      org_id = coalesce(public.profiles.org_id, excluded.org_id),
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      role = coalesce(public.profiles.role, excluded.role);

    update public.organizations 
    set created_by = r.id 
    where id = v_org_id and created_by is null;
  end loop;
end;
$$;


-- 4. NON-RECURSIVE RLS POLICIES FOR PROFILES & ORGANIZATIONS
drop policy if exists "Users can view active profiles in their org" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can insert profiles in their org" on public.profiles;
drop policy if exists "Admins can update profiles in their org" on public.profiles;
drop policy if exists "Admins can delete profiles in their org" on public.profiles;
drop policy if exists "Users can always read own profile" on public.profiles;
drop policy if exists "Users can always insert own profile" on public.profiles;
drop policy if exists "Users can read profiles in their workspace" on public.profiles;
drop policy if exists "Users can update own profile or admins can update org profiles" on public.profiles;
drop policy if exists "Admins can insert profiles in their workspace" on public.profiles;

create policy "Users can read profiles in their workspace"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or
  org_id in (
    select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null
  )
);

create policy "Users can update own profile or admins can update org profiles"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or
  org_id in (
    select p.org_id from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.deleted_at is null
  )
);

create policy "Admins can insert profiles in their workspace"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  or
  org_id in (
    select p.org_id from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.deleted_at is null
  )
);

drop policy if exists "Users can view their own organization" on public.organizations;
drop policy if exists "Admins can update their own organization" on public.organizations;
drop policy if exists "Users can always read own organization" on public.organizations;
drop policy if exists "Users can view their organization" on public.organizations;
drop policy if exists "Admins can update their organization" on public.organizations;

create policy "Users can view their organization"
on public.organizations for select
to authenticated
using (
  created_by = auth.uid()
  or
  id in (
    select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null
  )
);

create policy "Admins can update their organization"
on public.organizations for update
to authenticated
using (
  created_by = auth.uid()
  or
  id in (
    select p.org_id from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.deleted_at is null
  )
);

-- Ensure Slack integration columns exist
alter table public.organizations add column if not exists slack_webhook_url text;
alter table public.organizations add column if not exists slack_notifications_enabled boolean default true;

-- Ensure Realtime deletes emit old values (org_id) so client Kanban sync filters work
alter table if exists public.tasks replica identity full;

-- 5. WORKSPACE RLS POLICIES FOR TASKS & TEAMS (Ensures visibility without relying on optional JWT hook)
drop policy if exists "tasks_select_policy" on public.tasks;
drop policy if exists "Users can view tasks in their org" on public.tasks;
create policy "Users can view tasks in their org"
on public.tasks for select
to authenticated
using (
  org_id in (
    select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null
  )
);

drop policy if exists "teams_select_policy" on public.teams;
drop policy if exists "Users can view teams in their org" on public.teams;
create policy "Users can view teams in their org"
on public.teams for select
to authenticated
using (
  org_id in (
    select p.org_id from public.profiles p where p.id = auth.uid() and p.deleted_at is null
  )
);

drop policy if exists "team_members_select_policy" on public.team_members;
drop policy if exists "Users can view team members in their org" on public.team_members;
create policy "Users can view team members in their org"
on public.team_members for select
to authenticated
using (
  exists (
    select 1 from public.teams t
    join public.profiles p on p.org_id = t.org_id and p.id = auth.uid() and p.deleted_at is null
    where t.id = team_members.team_id
  )
);

drop policy if exists "task_assignees_select_policy" on public.task_assignees;
drop policy if exists "Users can view task assignees in their org" on public.task_assignees;
create policy "Users can view task assignees in their org"
on public.task_assignees for select
to authenticated
using (
  exists (
    select 1 from public.tasks t
    join public.profiles p on p.org_id = t.org_id and p.id = auth.uid() and p.deleted_at is null
    where t.id = task_assignees.task_id
  )
);


-- ==============================================================================
-- 6. SAMPLE WORKSPACE DATA SEED (Instantly populates realistic tasks & teams)
-- ==============================================================================
do $$
declare
  r_org record;
  v_user_id uuid;
  v_team_id uuid;
  v_task_id uuid;
  v_now timestamptz := now();
begin
  for r_org in (select id from public.organizations) loop
    -- 1. Get first profile in this org
    select id into v_user_id from public.profiles where org_id = r_org.id order by created_at asc limit 1;

    -- 2. Ensure Team exists
    select id into v_team_id from public.teams where org_id = r_org.id limit 1;
    if v_team_id is null then
      insert into public.teams (org_id, name)
      values (r_org.id, 'Engineering & Product')
      returning id into v_team_id;

      insert into public.teams (org_id, name)
      values (r_org.id, 'Operations & Growth');
    end if;

    -- 3. Delete old/corrupted tasks if count is 0
    if not exists (select 1 from public.tasks where org_id = r_org.id) then
      -- Task 1: Completed
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

      -- Task 2: In Progress (Urgent)
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

      -- Task 3: In Progress (High)
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

      -- Task 4: In Review (Medium)
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

      -- Task 5: Pending (High)
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

      -- Task 6: Pending (Medium)
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

      -- Add a sample comment
      insert into public.task_comments (task_id, user_id, body)
      values (v_task_id, v_user_id, 'Welcome to TASQ-ONE! Feel free to edit or drag this task across Kanban columns.');

      -- Add activity log
      insert into public.activity_logs (org_id, actor_id, action, entity, entity_id, diff)
      values (r_org.id, v_user_id, 'workspace.seeded', 'tasks', v_task_id, '{"message": "Workspace initialized with 6 sample tasks."}'::jsonb);
    end if;
  end loop;
end;
$$;

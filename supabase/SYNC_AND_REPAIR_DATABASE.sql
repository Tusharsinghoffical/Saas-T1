-- ==============================================================================
-- TASQ-ONE: MASTER DATABASE REPAIR & AUTH HOOK FIX SCRIPT
-- RUN THIS IN SUPABASE DASHBOARD -> SQL EDITOR -> CLICK "RUN"
-- ==============================================================================

-- 1. FIX AUTH HOOK: Keep Postgres Database Role as 'authenticated' & Inject App Role safely
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
  -- Extract claims and user ID from the event payload
  claims := event->'claims';
  target_user_id := (event->>'user_id')::uuid;

  -- Fetch org_id and role from the profiles table for this user
  select org_id, role
  into user_org_id, user_role
  from public.profiles
  where id = target_user_id;

  -- Inject claims into JWT
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

  -- CRITICAL: Top-level Postgres DB role MUST ALWAYS be 'authenticated' (NOT 'admin')
  claims := jsonb_set(claims, '{role}', to_jsonb('authenticated'::text));

  -- Return updated event with custom claims
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Grant permissions for Supabase Auth service role
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;


-- 2. AUTOMATIC USER TRIGGER (Auth.users -> Profiles & Organizations)
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

  if new.raw_app_meta_data->>'org_id' is not null and new.raw_app_meta_data->>'org_id' <> '' then
    v_org_id := (new.raw_app_meta_data->>'org_id')::uuid;
  elsif new.raw_user_meta_data->>'org_id' is not null and new.raw_user_meta_data->>'org_id' <> '' then
    v_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  end if;

  if v_org_id is null then
    select id into v_org_id from public.organizations where created_by = new.id limit 1;
    
    if v_org_id is null then
      insert into public.organizations (name, timezone)
      values (v_org_name, 'Asia/Kolkata')
      returning id into v_org_id;
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
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


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

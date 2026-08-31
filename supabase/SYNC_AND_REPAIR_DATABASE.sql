-- ==============================================================================
-- TASQ-ONE: MASTER DATABASE SYNC & TRIGGER SCRIPT (REPAIRED FK ORDER)
-- RUN THIS IN SUPABASE DASHBOARD -> SQL EDITOR -> CLICK "RUN"
-- ==============================================================================

-- 1. Automatic user provisioning function & trigger with decoupled FK insertion
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
  -- Extract metadata safely
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

  -- Check if org_id is already in metadata (e.g. employee invited to existing org)
  if new.raw_app_meta_data->>'org_id' is not null and new.raw_app_meta_data->>'org_id' <> '' then
    v_org_id := (new.raw_app_meta_data->>'org_id')::uuid;
  elsif new.raw_user_meta_data->>'org_id' is not null and new.raw_user_meta_data->>'org_id' <> '' then
    v_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  end if;

  -- If no org_id in metadata, look up or create organization
  if v_org_id is null then
    select id into v_org_id from public.organizations where created_by = new.id limit 1;
    
    if v_org_id is null then
      -- Step 1: Insert organization WITHOUT created_by (prevents FK violation)
      insert into public.organizations (name, timezone)
      values (v_org_name, 'Asia/Kolkata')
      returning id into v_org_id;
    end if;
  end if;

  -- Step 2: Insert into public.profiles
  insert into public.profiles (id, org_id, full_name, role, created_at)
  values (new.id, v_org_id, v_full_name, v_role, now())
  on conflict (id) do update set
    org_id = coalesce(public.profiles.org_id, excluded.org_id),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = coalesce(public.profiles.role, excluded.role);

  -- Step 3: Update created_by foreign key now that profile exists
  update public.organizations 
  set created_by = new.id 
  where id = v_org_id and created_by is null;

  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- 2. ONE-TIME SYNC FOR ALL EXISTING USERS IN auth.users
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
    
    -- Check if profile already exists with org_id
    select org_id into v_org_id from public.profiles where id = r.id;
    
    if v_org_id is null then
      select id into v_org_id from public.organizations where created_by = r.id limit 1;
      
      if v_org_id is null then
        select id into v_org_id from public.organizations limit 1;
        
        if v_org_id is null then
          -- Step 1: Insert organization WITHOUT created_by
          insert into public.organizations (name, timezone)
          values (v_org_name, 'Asia/Kolkata')
          returning id into v_org_id;
        end if;
      end if;
    end if;

    -- Step 2: Upsert profile
    insert into public.profiles (id, org_id, full_name, role, created_at)
    values (r.id, v_org_id, v_full_name, v_role, now())
    on conflict (id) do update set
      org_id = coalesce(public.profiles.org_id, excluded.org_id),
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      role = coalesce(public.profiles.role, excluded.role);

    -- Step 3: Update created_by foreign key
    update public.organizations 
    set created_by = r.id 
    where id = v_org_id and created_by is null;
  end loop;
end;
$$;


-- 3. PERMISSIVE POLICIES (Guarantees user profile & organization read access)
drop policy if exists "Users can always read own profile" on public.profiles;
create policy "Users can always read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or org_id = public.get_user_org_id());

drop policy if exists "Users can always insert own profile" on public.profiles;
create policy "Users can always insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid() or public.is_org_admin());

drop policy if exists "Users can always read own organization" on public.organizations;
create policy "Users can always read own organization"
on public.organizations for select
to authenticated
using (id = public.get_user_org_id() or created_by = auth.uid());

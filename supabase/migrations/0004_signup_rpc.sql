-- ==============================================================================
-- TASQ-ONE — Atomic Organization Signup Transaction RPC Migration
-- Migration: 0004_signup_rpc.sql
-- Stack: Supabase Postgres RPC (Creates org + sets admin profile in 1 transaction)
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
  -- 1. Insert new organization
  insert into public.organizations (name, timezone)
  values (p_org_name, coalesce(p_timezone, 'Asia/Kolkata'))
  returning id into v_org_id;

  -- 2. Upsert profile for the authenticated user with role = 'admin' and the new org_id
  insert into public.profiles (id, org_id, full_name, role)
  values (p_user_id, v_org_id, p_full_name, 'admin')
  on conflict (id) do update
  set org_id = v_org_id,
      full_name = coalesce(p_full_name, profiles.full_name),
      role = 'admin';

  -- 3. Record the creation in audit logs
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

-- Grant execution to authenticated users and service role
grant execute on function public.signup_organization_admin(text, uuid, text, text) to authenticated, service_role, anon;

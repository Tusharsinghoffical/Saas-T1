-- ==============================================================================
-- TASQ-ONE — Custom Access Token (JWT) Auth Hook Migration
-- Migration: 0003_auth_hook.sql
-- Stack: Supabase Auth Hook (Injects org_id & role into JWT at login/refresh)
-- ==============================================================================

-- 1. Create the Custom Access Token Hook function
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

  -- Inject claims if user profile exists
  if user_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id::text));
  end if;

  if user_role is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{role}', to_jsonb('employee'::text));
  end if;

  -- Return updated event with custom claims
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- 2. Set strict permissions for Supabase Auth service role
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

-- Grant required table read access to auth admin
grant usage on schema public to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;

-- ==============================================================================
-- REGISTRATION INSTRUCTIONS (Supabase Dashboard):
-- ==============================================================================
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/<your-project-ref>
-- 2. Navigate to: Authentication > Hooks (or Authentication > URL Configuration > Hooks)
-- 3. Locate the "Custom Access Token (JWT)" section
-- 4. Enable the hook, select "Postgres function", and choose:
--    Schema: public
--    Function: custom_access_token_hook(jsonb)
-- 5. Click "Save"
-- ==============================================================================

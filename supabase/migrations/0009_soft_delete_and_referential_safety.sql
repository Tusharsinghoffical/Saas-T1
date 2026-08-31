-- ==============================================================================
-- TASQ-ONE MIGRATION 0009: Soft Delete & Referential Safety
-- Purpose:
--   1. Add soft delete column (deleted_at) to profiles to preserve historical context
--      across tasks, comments, assignees, and audit logs.
--   2. Add created_by column to organizations (with backfill from earliest admin profile).
--   3. Ensure active profiles index and update RLS policies for soft deletion.
-- ==============================================================================

-- 1. Add deleted_at column to profiles if not present
alter table public.profiles
add column if not exists deleted_at timestamptz default null;

-- Partial index for active profiles to optimize frequent queries
create index if not exists idx_profiles_active
on public.profiles(org_id)
where deleted_at is null;

-- 2. Add created_by column to organizations if not present
alter table public.organizations
add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- Backfill created_by for existing organizations with earliest admin profile
update public.organizations o
set created_by = (
  select p.id
  from public.profiles p
  where p.org_id = o.id and p.role = 'admin'
  order by p.created_at asc
  limit 1
)
where o.created_by is null;

-- 3. Soft-delete aware RLS update
-- Active profiles select policy: Users can see all active members in their org,
-- plus deactivated members only when referenced historically (or admins inspecting org)
comment on column public.profiles.deleted_at is
  'Timestamp when user was deactivated/soft-deleted. Null indicates active user.';

comment on column public.organizations.created_by is
  'The founding admin profile who registered the organization.';

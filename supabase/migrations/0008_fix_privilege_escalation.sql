-- ==============================================================================
-- TASQ-ONE — Security Remediation: Privilege Escalation Fix
-- Migration: 0008_fix_privilege_escalation.sql
-- Audit Finding: FAIL 7.3 — profiles_update_policy allows employees to self-update
--                role and org_id columns, enabling privilege escalation to admin.
-- Fix: Split into two distinct policies:
--   1. profiles_self_update_policy  — non-admins can update their own row ONLY if
--      role and org_id remain unchanged (WITH CHECK enforces immutability).
--   2. profiles_admin_update_policy — admins can update any profile in their org
--      including role and org_id changes.
-- Defense-in-depth layer: Database / RLS (supplements usecase-layer guard in
-- domains/auth and org controllers per DDS architecture).
-- ==============================================================================

-- 1. Drop the vulnerable catch-all update policy
drop policy if exists "profiles_update_policy" on profiles;

-- ==============================================================================
-- 2a. Self-update policy: users can update their own profile row BUT cannot
--     change role or org_id. The WITH CHECK subquery re-reads the current
--     DB values to compare against proposed new values.
-- ==============================================================================
create policy "profiles_self_update_policy"
on profiles for update
using (
  -- Only the profile owner can use this policy path
  id = auth.uid()
)
with check (
  -- Must still be their own row
  id = auth.uid()
  -- role column must match the value already stored in the database
  and role = (select p.role from profiles p where p.id = auth.uid() limit 1)
  -- org_id column must match the value already stored in the database
  and org_id = (select p.org_id from profiles p where p.id = auth.uid() limit 1)
);

-- ==============================================================================
-- 2b. Admin update policy: admins can update any profile within their org,
--     including changing role and org_id (for member management).
-- ==============================================================================
create policy "profiles_admin_update_policy"
on profiles for update
using (
  -- Admin must be in the same org as the target profile
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') = 'admin'
)
with check (
  -- New org_id must still be within the admin's own org
  org_id = (auth.jwt() ->> 'org_id')::uuid
  and (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- 3. Comment on intent for future auditors
-- ==============================================================================
comment on table profiles is
  'User profiles for TASQ-ONE. Role and org_id are protected by split RLS policies:
   non-admins (profiles_self_update_policy) cannot alter their own role or org_id.
   Only admins (profiles_admin_update_policy) may change role/org membership.
   Remediation: 0008_fix_privilege_escalation.sql — August 2026 Security Audit.';

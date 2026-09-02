-- Migration: 0003_team_assignment_guarantee.sql
-- Goal: Guarantee that every Employee and Manager belongs to an assigned team.
--       Auto-creates a default "General" team per organization and backfills orphan profiles.

-- 1. Ensure a default 'General' team exists for every organization
insert into public.teams (org_id, name)
select o.id, 'General'
from public.organizations o
where not exists (
    select 1 from public.teams t where t.org_id = o.id
);

-- 2. Backfill any existing profiles (employee / manager) that lack a team_members row
insert into public.team_members (team_id, user_id)
select distinct
    (
        select t.id
        from public.teams t
        where t.org_id = p.org_id
        order by t.name = 'General' desc, t.id asc
        limit 1
    ) as team_id,
    p.id as user_id
from public.profiles p
where p.org_id is not null
  and p.role in ('employee', 'manager')
  and not exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where tm.user_id = p.id and t.org_id = p.org_id
  )
on conflict (team_id, user_id) do nothing;

-- 3. Trigger to auto-assign new profiles to organization's default team if not already assigned
create or replace function public.auto_assign_default_team()
returns trigger
language plpgsql
security definer
as $$
declare
    v_team_id uuid;
begin
    -- Only auto-assign for employee or manager roles with an org_id
    if new.org_id is not null and new.role in ('employee', 'manager') then
        -- Find or create the default team for this org
        select id into v_team_id
        from public.teams
        where org_id = new.org_id
        order by (name = 'General') desc, id asc
        limit 1;

        if v_team_id is null then
            insert into public.teams (org_id, name)
            values (new.org_id, 'General')
            returning id into v_team_id;
        end if;

        -- Insert team_members record if not already mapped
        insert into public.team_members (team_id, user_id)
        values (v_team_id, new.id)
        on conflict (team_id, user_id) do nothing;
    end if;

    return new;
end;
$$;

drop trigger if exists trigger_auto_assign_default_team on public.profiles;
create trigger trigger_auto_assign_default_team
after insert or update of org_id, role on public.profiles
for each row
execute function public.auto_assign_default_team();

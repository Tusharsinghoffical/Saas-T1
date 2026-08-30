-- ==============================================================================
-- TASQ-ONE — Database Initialization Migration
-- Migration: 0001_init.sql
-- Source: docs/03-ARCHITECTURE.md (Section 4)
-- Stack: Supabase Postgres, Zero-AWS
-- ==============================================================================

-- Enable UUID extension if not already present
create extension if not exists "pgcrypto";

-- 1. organizations
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now()
);

-- 2. profiles (extends supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'manager', 'employee')) default 'employee',
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  manager_id uuid references profiles(id)
);

-- 4. team_members
create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

-- 5. tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  team_id uuid references teams(id),
  title text not null,
  description text,
  status text check (status in ('pending', 'in_progress', 'in_review', 'completed')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  due_date timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. task_assignees
create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

-- 7. task_dependencies
create table if not exists task_dependencies (
  task_id uuid references tasks(id) on delete cascade,
  depends_on_task_id uuid references tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id)
);

-- 8. task_comments
create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- 9. task_attachments
create table if not exists task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 10. notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 11. activity_logs
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz default now()
);

-- ==============================================================================
-- PERFORMANCE INDEXES (Architecture Section 4)
-- ==============================================================================

create index if not exists idx_tasks_org_status on tasks(org_id, status);
create index if not exists idx_tasks_org_due_date on tasks(org_id, due_date);
create index if not exists idx_notifications_user_read on notifications(user_id, read_at);
create index if not exists idx_activity_logs_org_created on activity_logs(org_id, created_at desc);

-- Foreign key lookup & join indexes
create index if not exists idx_profiles_org on profiles(org_id);
create index if not exists idx_teams_org on teams(org_id);
create index if not exists idx_team_members_user on team_members(user_id);
create index if not exists idx_task_assignees_user on task_assignees(user_id);
create index if not exists idx_task_comments_task on task_comments(task_id);
create index if not exists idx_task_attachments_task on task_attachments(task_id);
create index if not exists idx_task_dependencies_depends on task_dependencies(depends_on_task_id);

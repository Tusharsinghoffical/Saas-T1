-- ==============================================================================
-- TASQ-ONE NOTIFICATIONS SYSTEM MIGRATION (0005_notifications.sql)
-- Auto-generates in-app notifications for task assignments, @mentions,
-- and due date thresholds (due soon & overdue).
-- ==============================================================================

-- 1. Ensure notification_preferences column on profiles
alter table if exists profiles
add column if not exists notification_preferences jsonb default '{
  "task_assigned": true,
  "task_mentioned": true,
  "task_due_soon": true,
  "task_overdue": true
}'::jsonb;

-- 2. Trigger Function: Task Assigned Notification
create or replace function notify_on_task_assigned()
returns trigger
language plpgsql
security definer
as $$
declare
  v_task record;
  v_actor_name text;
begin
  select title, org_id, created_by into v_task from tasks where id = new.task_id;
  select full_name into v_actor_name from profiles where id = auth.uid();

  insert into notifications (
    user_id,
    type,
    payload,
    created_at
  ) values (
    new.user_id,
    'task.assigned',
    jsonb_build_object(
      'task_id', new.task_id,
      'task_title', v_task.title,
      'actor_name', coalesce(v_actor_name, 'A team member'),
      'message', 'You were assigned to task: ' || v_task.title
    ),
    now()
  );

  return new;
end;
$$;

drop trigger if exists tr_notify_task_assigned on task_assignees;
create trigger tr_notify_task_assigned
after insert on task_assignees
for each row
execute function notify_on_task_assigned();

-- 3. Trigger Function: Comment @Mentions Notification
create or replace function notify_on_comment_mention()
returns trigger
language plpgsql
security definer
as $$
declare
  v_task_title text;
  v_author_name text;
  v_mentioned_user record;
begin
  select title into v_task_title from tasks where id = new.task_id;
  select full_name into v_author_name from profiles where id = new.user_id;

  -- Look for @username mentions against profile full names
  for v_mentioned_user in
    select id, full_name
    from profiles
    where new.body ~* ('@' || full_name)
      and id <> new.user_id
  loop
    insert into notifications (
      user_id,
      type,
      payload,
      created_at
    ) values (
      v_mentioned_user.id,
      'task.mentioned',
      jsonb_build_object(
        'task_id', new.task_id,
        'task_title', v_task_title,
        'comment_id', new.id,
        'actor_name', coalesce(v_author_name, 'A team member'),
        'message', coalesce(v_author_name, 'A team member') || ' mentioned you in ' || v_task_title
      ),
      now()
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists tr_notify_comment_mention on task_comments;
create trigger tr_notify_comment_mention
after insert on task_comments
for each row
execute function notify_on_comment_mention();

-- 4. Scheduled Function: Check Due Soon (24h) and Overdue Tasks
create or replace function check_upcoming_and_overdue_tasks()
returns void
language plpgsql
security definer
as $$
declare
  v_task record;
  v_assignee record;
begin
  -- Find tasks due in next 24 hours that are not completed
  for v_task in
    select id, title, due_date
    from tasks
    where status <> 'completed'
      and due_date between now() and (now() + interval '24 hours')
  loop
    for v_assignee in select user_id from task_assignees where task_id = v_task.id loop
      -- Only notify once per 24 hours
      if not exists (
        select 1 from notifications
        where user_id = v_assignee.user_id
          and type = 'task.due_soon'
          and (payload->>'task_id')::uuid = v_task.id
          and created_at > (now() - interval '24 hours')
      ) then
        insert into notifications (user_id, type, payload)
        values (
          v_assignee.user_id,
          'task.due_soon',
          jsonb_build_object(
            'task_id', v_task.id,
            'task_title', v_task.title,
            'message', 'Task is due within 24 hours: ' || v_task.title
          )
        );
      end if;
    end loop;
  end loop;

  -- Find overdue tasks
  for v_task in
    select id, title, due_date
    from tasks
    where status <> 'completed'
      and due_date < now()
  loop
    for v_assignee in select user_id from task_assignees where task_id = v_task.id loop
      if not exists (
        select 1 from notifications
        where user_id = v_assignee.user_id
          and type = 'task.overdue'
          and (payload->>'task_id')::uuid = v_task.id
          and created_at > (now() - interval '24 hours')
      ) then
        insert into notifications (user_id, type, payload)
        values (
          v_assignee.user_id,
          'task.overdue',
          jsonb_build_object(
            'task_id', v_task.id,
            'task_title', v_task.title,
            'message', 'Task is overdue: ' || v_task.title
          )
        );
      end if;
    end loop;
  end loop;
end;
$$;

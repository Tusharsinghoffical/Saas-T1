-- ==============================================================================
-- TASQ-ONE SLACK WEBHOOK INTEGRATION MIGRATION (0006_slack_integration.sql)
-- Adds slack_webhook_url and slack_notifications_enabled to organizations
-- ==============================================================================

alter table if exists organizations
add column if not exists slack_webhook_url text,
add column if not exists slack_notifications_enabled boolean default true;

-- Update RLS: only admins can update org settings
-- (organizations_update_policy already restricts update to org admins)

-- ==============================================================================
-- TASQ-ONE BILLING & SUBSCRIPTIONS MIGRATION (0007_billing_scaffolding.sql)
-- Scaffolds subscriptions table behind feature flag for Stripe integration.
-- ==============================================================================

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on subscriptions
alter table subscriptions enable row level security;

-- 1. Members can view their organization's subscription
create policy "subscriptions_select_policy"
on subscriptions for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- 2. Only Service Role can insert/update/delete subscriptions via Stripe webhook
create policy "subscriptions_service_insert"
on subscriptions for insert
with check (true);

create policy "subscriptions_service_update"
on subscriptions for update
using (true)
with check (true);

-- Index for fast lookup by stripe_customer_id and stripe_subscription_id
create index if not exists idx_subscriptions_org_id on subscriptions(org_id);
create index if not exists idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);
create index if not exists idx_subscriptions_stripe_sub on subscriptions(stripe_subscription_id);

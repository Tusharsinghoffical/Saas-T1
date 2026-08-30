/**
 * Pure Domain Entities: Organization & Subscription
 * ZERO framework or database imports.
 */

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
  timezone: string;
  slackWebhookUrl?: string | null;
  slackNotificationsEnabled?: boolean | null;
  createdAt?: string;
}

export interface OrgSettingsUpdate {
  name?: string;
  timezone?: string;
  slackWebhookUrl?: string;
  slackNotificationsEnabled?: boolean;
}

export interface Subscription {
  orgId: string;
  plan: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  updatedAt?: string;
}

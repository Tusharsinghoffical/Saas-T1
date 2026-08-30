import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { Subscription } from "../entities/Organization";

export interface ISubscriptionRepository {
  upsertSubscription(sub: Subscription): Promise<void>;
  updateSubscriptionByStripeId(stripeSubId: string, updates: Partial<Subscription>): Promise<void>;
}

export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  private hasSupabase(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url) && !url.includes("your-project-ref");
  }

  async upsertSubscription(sub: Subscription): Promise<void> {
    if (!this.hasSupabase()) return;

    const adminClient = createAdminClient();
    await (adminClient.from("subscriptions") as any).upsert({
      org_id: sub.orgId,
      plan: sub.plan,
      status: sub.status,
      stripe_customer_id: sub.stripeCustomerId || null,
      stripe_subscription_id: sub.stripeSubscriptionId || null,
      updated_at: sub.updatedAt || new Date().toISOString(),
    });
  }

  async updateSubscriptionByStripeId(stripeSubId: string, updates: Partial<Subscription>): Promise<void> {
    if (!this.hasSupabase()) return;

    const adminClient = createAdminClient();
    const dbPayload: Record<string, any> = {
      updated_at: updates.updatedAt || new Date().toISOString(),
    };

    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.plan !== undefined) dbPayload.plan = updates.plan;
    if (updates.cancelAtPeriodEnd !== undefined) dbPayload.cancel_at_period_end = updates.cancelAtPeriodEnd;
    if (updates.currentPeriodStart !== undefined) dbPayload.current_period_start = updates.currentPeriodStart;
    if (updates.currentPeriodEnd !== undefined) dbPayload.current_period_end = updates.currentPeriodEnd;

    await (adminClient.from("subscriptions") as any)
      .update(dbPayload)
      .eq("stripe_subscription_id", stripeSubId);
  }
}

export const subscriptionRepository = new SupabaseSubscriptionRepository();

import type Stripe from "stripe";
import { redisGet, redisSet } from "@/infrastructure/redis/redisClient";
import { logger } from "@/infrastructure/logger/logger";
import { ISubscriptionRepository, subscriptionRepository } from "../repository/subscriptionRepository";

export async function handleStripeWebhookUseCase(
  event: Stripe.Event,
  repo: ISubscriptionRepository = subscriptionRepository
): Promise<{ received: boolean; action?: string; duplicate?: boolean }> {
  const eventId = event.id;
  const idempotencyKey = `stripe:webhook:${eventId}`;

  // Deduplicate replayed webhook events within 24 hours (86,400 seconds)
  const alreadyProcessed = await redisGet(idempotencyKey);
  if (alreadyProcessed) {
    logger.info({
      event: "stripe_webhook_duplicate_skipped",
      eventId,
      type: event.type,
    });
    return { received: true, action: "duplicate_skipped", duplicate: true };
  }

  // Mark event as processed with 24-hour TTL
  await redisSet(
    idempotencyKey,
    { processedAt: new Date().toISOString(), type: event.type },
    86400
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data?.object as Stripe.Checkout.Session;
      const orgId = session?.metadata?.org_id;
      const customerId =
        typeof session?.customer === "string" ? session.customer : session?.customer?.id;
      const subscriptionId =
        typeof session?.subscription === "string"
          ? session.subscription
          : session?.subscription?.id;
      const plan = session?.metadata?.plan || "pro";

      if (orgId) {
        await repo.upsertSubscription({
          orgId,
          plan,
          status: "active",
          stripeCustomerId: customerId || undefined,
          stripeSubscriptionId: subscriptionId || undefined,
        });
      }
      return { received: true, action: "checkout.session.completed" };
    }

    case "customer.subscription.updated": {
      const sub = event.data?.object as Stripe.Subscription;
      const subId = sub?.id;
      const status = sub?.status;
      const cancelAtPeriodEnd = sub?.cancel_at_period_end;
      const currentPeriodStart = (sub as any)?.current_period_start
        ? new Date((sub as any).current_period_start * 1000).toISOString()
        : undefined;
      const currentPeriodEnd = (sub as any)?.current_period_end
        ? new Date((sub as any).current_period_end * 1000).toISOString()
        : undefined;

      if (subId) {
        await repo.updateSubscriptionByStripeId(subId, {
          status,
          cancelAtPeriodEnd,
          currentPeriodStart,
          currentPeriodEnd,
        });
      }
      return { received: true, action: "customer.subscription.updated" };
    }

    case "customer.subscription.deleted": {
      const sub = event.data?.object as Stripe.Subscription;
      const subId = sub?.id;

      if (subId) {
        await repo.updateSubscriptionByStripeId(subId, {
          plan: "free",
          status: "canceled",
        });
      }
      return { received: true, action: "customer.subscription.deleted" };
    }

    default:
      return { received: true, action: "unhandled" };
  }
}

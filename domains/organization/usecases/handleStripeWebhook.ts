import { ISubscriptionRepository, subscriptionRepository } from "../repository/subscriptionRepository";

export async function handleStripeWebhookUseCase(
  event: any,
  repo: ISubscriptionRepository = subscriptionRepository
): Promise<{ received: boolean; action?: string }> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data?.object;
      const orgId = session?.metadata?.org_id;
      const customerId = session?.customer;
      const subscriptionId = session?.subscription;
      const plan = session?.metadata?.plan || "pro";

      if (orgId) {
        await repo.upsertSubscription({
          orgId,
          plan,
          status: "active",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });
      }
      return { received: true, action: "checkout.session.completed" };
    }

    case "customer.subscription.updated": {
      const sub = event.data?.object;
      const subId = sub?.id;
      const status = sub?.status;
      const cancelAtPeriodEnd = sub?.cancel_at_period_end;
      const currentPeriodStart = sub?.current_period_start
        ? new Date(sub.current_period_start * 1000).toISOString()
        : undefined;
      const currentPeriodEnd = sub?.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
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
      const sub = event.data?.object;
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

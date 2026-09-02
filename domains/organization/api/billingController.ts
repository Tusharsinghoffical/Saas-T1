import crypto from "crypto";
import { isBillingEnabled } from "@/lib/billing/config";
import { handleStripeWebhookUseCase } from "../usecases/handleStripeWebhook";
import { recordActivityLogUseCase } from "@/domains/activity/usecases/recordActivityLog";
import { ValidationError, NotFoundError } from "@/shared/errors/domainErrors";

export class BillingController {
  async handleWebhook(rawBody: string, signature: string | null) {
    if (!isBillingEnabled()) {
      throw new NotFoundError("Billing webhook endpoint is disabled.");
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new ValidationError("STRIPE_WEBHOOK_SECRET is not configured on server.");
    if (!signature) throw new ValidationError("Missing Stripe-Signature header.");
    const parts = signature.split(",").reduce((acc: any, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});
    const timestamp = parts.t;
    const expectedSig = parts.v1;
    if (!timestamp || !expectedSig) throw new ValidationError("Invalid Stripe signature header format.");
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) throw new ValidationError("Stripe webhook timestamp out of tolerance.");
    const signedPayload = `${timestamp}.${rawBody}`;
    const computedSig = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
    if (computedSig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(expectedSig))) {
      throw new ValidationError("Invalid Stripe signature.");
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new ValidationError("Invalid JSON payload");
    }

    const result = await handleStripeWebhookUseCase(event);

    // Record activity log if checkout completed
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const orgId = session?.metadata?.org_id;
      const plan = session?.metadata?.plan || "pro";
      if (orgId) {
        await recordActivityLogUseCase({
          orgId,
          actorId: null,
          action: "subscription.created",
          entity: "subscriptions",
          entityId: orgId,
          diff: { plan, status: "active" },
        });
      }
    }

    return result;
  }
}

export const billingController = new BillingController();

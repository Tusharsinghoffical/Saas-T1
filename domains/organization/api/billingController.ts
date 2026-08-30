import crypto from "crypto";
import { isBillingEnabled } from "@/lib/billing/config";
import { handleStripeWebhookUseCase } from "../usecases/handleStripeWebhook";
import { recordActivityLogUseCase } from "@/domains/activity/usecases/recordActivityLog";
import { ValidationError } from "@/shared/errors/domainErrors";

export class BillingController {
  async handleWebhook(rawBody: string, signature: string | null) {
    if (!isBillingEnabled()) {
      return {
        success: true,
        message: "Billing module is scaffolded but currently disabled via feature flag.",
        status: "billing_feature_disabled",
      };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify Stripe Webhook Signature with pure Node.js crypto
    if (webhookSecret && signature) {
      try {
        const parts = signature.split(",").reduce((acc: any, part) => {
          const [k, v] = part.split("=");
          if (k && v) acc[k.trim()] = v.trim();
          return acc;
        }, {});

        const timestamp = parts.t;
        const expectedSig = parts.v1;

        if (!timestamp || !expectedSig) {
          throw new ValidationError("Invalid stripe signature header format");
        }

        const signedPayload = `${timestamp}.${rawBody}`;
        const computedSig = crypto
          .createHmac("sha256", webhookSecret)
          .update(signedPayload)
          .digest("hex");

        if (computedSig !== expectedSig) {
          throw new ValidationError("Invalid stripe signature");
        }
      } catch (err: any) {
        throw new ValidationError(err.message || "Signature verification failed");
      }
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

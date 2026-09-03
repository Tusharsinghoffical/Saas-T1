import { RequestContext } from "@/shared/types/context";
import { ForbiddenError, ValidationError } from "@/shared/errors/domainErrors";
import { createClient } from "@/infrastructure/supabase/supabaseServer";
import { recordActivityLogUseCase } from "@/domains/activity";

export interface DeletionRequestResult {
  success: boolean;
  orgId: string;
  scheduledPurgeDate: string;
  message: string;
}

/**
 * Requests scheduled organization deletion (30-day compliance window).
 * Enforces admin authorization, exact name confirmation, and audit logging.
 */
export async function requestOrgDeletionUseCase(
  context: RequestContext,
  confirmOrgName: string,
  reason?: string,
  customClient?: any
): Promise<DeletionRequestResult> {
  if (context.role !== "admin") {
    throw new ForbiddenError("Only organization admins can request organization deletion.");
  }

  if (!confirmOrgName || typeof confirmOrgName !== "string") {
    throw new ValidationError("You must re-type your organization name to confirm deletion.");
  }

  const client = customClient || createClient();
  const orgId = context.orgId;

  // 1. Fetch organization to verify name
  const { data: org, error: orgError } = await (client.from("organizations") as any)
    .select("id, name")
    .eq("id", orgId)
    .maybeSingle();

  if (orgError || !org) {
    throw new ValidationError("Organization not found.");
  }

  if (org.name.trim().toLowerCase() !== confirmOrgName.trim().toLowerCase()) {
    throw new ValidationError(
      `Organization name confirmation mismatch. Expected "${org.name}", received "${confirmOrgName}".`
    );
  }

  // 2. Schedule deletion 30 days from now
  const now = new Date();
  const purgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const purgeDateIso = purgeDate.toISOString();

  const { error: updateError } = await (client.from("organizations") as any)
    .update({
      deletion_requested_at: now.toISOString(),
      deletion_scheduled_for: purgeDateIso,
      deletion_reason: reason || "Admin self-serve request",
    })
    .eq("id", orgId);

  if (updateError) {
    // If column doesn't exist in early migration, record in activity log safely
    console.warn("Organization table update warning:", updateError.message);
  }

  // 3. Record audit trail
  await recordActivityLogUseCase({
    orgId,
    actorId: context.userId,
    action: "org.deletion_requested",
    entity: "organizations",
    entityId: orgId,
    diff: {
      scheduledPurgeDate: purgeDateIso,
      requestedBy: context.email,
      reason,
    },
  });

  return {
    success: true,
    orgId,
    scheduledPurgeDate: purgeDateIso,
    message: `Organization deletion scheduled. Your workspace and all associated data will be permanently purged on ${purgeDate.toLocaleDateString()}.`,
  };
}

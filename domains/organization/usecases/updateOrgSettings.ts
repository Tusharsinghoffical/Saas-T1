import { RequestContext } from "@/shared/types/context";
import { ForbiddenError } from "@/shared/errors/domainErrors";
import { Organization, OrgSettingsUpdate } from "../entities/Organization";
import { IOrgRepository, orgRepository } from "../repository/orgRepository";

export async function updateOrgSettingsUseCase(
  context: RequestContext,
  updates: OrgSettingsUpdate,
  targetOrgId?: string,
  repo: IOrgRepository = orgRepository
): Promise<Organization> {
  if (targetOrgId && targetOrgId !== context.orgId) {
    throw new ForbiddenError("Cannot update settings of an organization you do not belong to.");
  }
  const updatedOrg = await repo.updateOrg(context.orgId, updates);
  return updatedOrg;
}

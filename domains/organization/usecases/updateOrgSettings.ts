import { RequestContext } from "@/shared/types/context";
import { Organization, OrgSettingsUpdate } from "../entities/Organization";
import { IOrgRepository, orgRepository } from "../repository/orgRepository";

export async function updateOrgSettingsUseCase(
  context: RequestContext,
  updates: OrgSettingsUpdate,
  repo: IOrgRepository = orgRepository
): Promise<Organization> {
  const updatedOrg = await repo.updateOrg(context.orgId, updates);
  return updatedOrg;
}

import { RequestContext } from "@/shared/types/context";
import { Organization } from "../entities/Organization";
import { IOrgRepository, orgRepository } from "../repository/orgRepository";
import { NotFoundError } from "@/shared/errors/domainErrors";

export async function getOrgSettingsUseCase(
  context: RequestContext,
  repo: IOrgRepository = orgRepository
): Promise<Organization> {
  const org = await repo.getOrgById(context.orgId);
  if (!org) {
    throw new NotFoundError("Organization not found.");
  }
  return org;
}

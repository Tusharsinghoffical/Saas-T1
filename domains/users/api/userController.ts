import { requireAuth } from "@/shared/middleware/rbacGuard";
import { listOrgMembersUseCase } from "../usecases/listOrgMembers";
import { getUserProfileUseCase } from "../usecases/getUserProfile";

export class UserController {
  async getMembers() {
    const auth = await requireAuth();
    return await listOrgMembersUseCase(auth);
  }

  async getProfile(userId: string) {
    await requireAuth();
    return await getUserProfileUseCase(userId);
  }
}

export const userController = new UserController();

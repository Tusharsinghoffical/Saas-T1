import { requireAuth } from "@/shared/middleware/rbacGuard";
import { listOrgMembersUseCase } from "../usecases/listOrgMembers";
import { getUserProfileUseCase } from "../usecases/getUserProfile";
import { inviteUserUseCase, InviteUserInput } from "../usecases/inviteUser";
import { acceptInviteUseCase } from "../usecases/acceptInvite";
import { removeUserUseCase } from "../usecases/removeUser";

export class UserController {
  async getMembers() {
    const auth = await requireAuth();
    return await listOrgMembersUseCase(auth);
  }

  async getProfile(userId: string) {
    await requireAuth();
    return await getUserProfileUseCase(userId);
  }

  async inviteMember(input: InviteUserInput) {
    const auth = await requireAuth();
    return await inviteUserUseCase(auth, input);
  }

  async acceptInvite(password: string) {
    return await acceptInviteUseCase(password);
  }

  async removeMember(targetUserId: string) {
    const auth = await requireAuth();
    return await removeUserUseCase(auth, targetUserId);
  }
}

export const userController = new UserController();

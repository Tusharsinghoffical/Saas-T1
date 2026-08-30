import { UserRole } from "@/infrastructure/supabase/database.types";

export interface RequestContext {
  userId: string;
  orgId: string;
  role: UserRole;
  email: string;
}

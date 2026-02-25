export type UserRole = "super" | "boss" | "manager" | "normal";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super: 4,
  boss: 3,
  manager: 2,
  normal: 1,
};

export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

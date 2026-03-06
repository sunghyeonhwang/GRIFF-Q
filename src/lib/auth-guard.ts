"use server";

import { createClient } from "@/lib/supabase/server";
import { type UserRole, hasMinimumRole } from "@/types/auth.types";

export async function requireRole(minRole: UserRole): Promise<{
  userId: string;
  role: UserRole;
  name: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증 필요");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || !hasMinimumRole(profile.role as UserRole, minRole)) {
    throw new Error("권한이 부족합니다");
  }

  return {
    userId: user.id,
    role: profile.role as UserRole,
    name: profile.name,
  };
}

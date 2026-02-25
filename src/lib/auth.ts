import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type UserProfile, type UserRole, hasMinimumRole } from "@/types/auth.types";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserWithRole(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireAuth(): Promise<UserProfile> {
  const profile = await getUserWithRole();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=inactive");
  return profile;
}

export async function requireRole(minimumRole: UserRole): Promise<UserProfile> {
  const profile = await requireAuth();
  if (!hasMinimumRole(profile.role, minimumRole)) {
    redirect("/dashboard?error=unauthorized");
  }
  return profile;
}

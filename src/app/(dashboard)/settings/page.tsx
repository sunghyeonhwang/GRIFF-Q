import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function SettingsPage() {
  await requireRole("boss");
  redirect("/settings/users");
}

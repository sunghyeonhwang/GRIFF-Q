import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function PredictPage() {
  await requireRole("manager");
  redirect("/predict/avatars");
}

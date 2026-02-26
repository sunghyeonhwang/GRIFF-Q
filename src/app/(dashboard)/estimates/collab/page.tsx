import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CollabEstimateView } from "@/components/estimates/collab-estimate-view";

export default async function CollabEstimatesPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: estimates } = await supabase
    .from("estimates")
    .select("id, project_name, client_name, status, estimate_date, created_at, users!estimates_created_by_fkey(name)")
    .order("created_at", { ascending: false });

  return (
    <CollabEstimateView
      estimates={estimates ?? []}
      userId={user.id}
      userName={user.name}
    />
  );
}

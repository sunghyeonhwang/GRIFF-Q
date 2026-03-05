import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { KickoffPageLayout } from "@/components/kickoff/kickoff-page-layout";

export default async function KickoffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, status, lead_user_id, start_date, end_date, description"
    )
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Fetch kickoff data
  const { data: kickoff } = await supabase
    .from("project_kickoffs")
    .select("*")
    .eq("project_id", id)
    .single();

  // Fetch users for assignee selection
  const { data: users } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  let checklistItems: any[] = [];
  let acknowledgments: any[] = [];
  let aiConversation: any = null;

  if (kickoff) {
    const [checklistRes, ackRes, aiRes] = await Promise.all([
      supabase
        .from("kickoff_checklist_items")
        .select("*")
        .eq("kickoff_id", kickoff.id)
        .order("sort_order"),
      supabase
        .from("kickoff_acknowledgments")
        .select("*, users!kickoff_acknowledgments_user_id_fkey(name)")
        .eq("kickoff_id", kickoff.id),
      supabase
        .from("kickoff_ai_conversations")
        .select("*")
        .eq("kickoff_id", kickoff.id)
        .eq("user_id", user.id)
        .single(),
    ]);
    checklistItems = checklistRes.data ?? [];
    acknowledgments = ackRes.data ?? [];
    aiConversation = aiRes.data;
  }

  return (
    <KickoffPageLayout
      project={project}
      kickoff={kickoff}
      checklistItems={checklistItems}
      acknowledgments={acknowledgments}
      aiConversation={aiConversation}
      users={users ?? []}
      currentUser={user}
    />
  );
}

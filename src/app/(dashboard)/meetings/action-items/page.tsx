import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionItemsView } from "@/components/meetings/action-items-view";
import { PageHeader } from "@/components/layout/page-header";

export default async function ActionItemsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch all action items with meeting info
  const { data: rawItems } = await supabase
    .from("action_items")
    .select("id, title, status, due_date, note, meeting_id, assignee_id, meetings(title)")
    .order("due_date", { ascending: true, nullsFirst: false });

  // Fetch active projects for Task promotion
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  const projects = (projectsData ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  // Fetch all users for assignee names
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const userMap = new Map((allUsers ?? []).map((u) => [u.id, u.name]));

  const actionItems = (rawItems ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    due_date: item.due_date,
    note: item.note,
    meeting_id: item.meeting_id,
    meeting_title: (item as any).meetings?.title ?? "삭제된 회의",
    assignee_name: item.assignee_id ? (userMap.get(item.assignee_id) ?? null) : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="액션아이템 통합 뷰"
        description="모든 회의록의 액션아이템을 한눈에 확인합니다."
      />
      <ActionItemsView actionItems={actionItems} projects={projects} />
    </div>
  );
}

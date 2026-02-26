import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ActionItemsView } from "@/components/meetings/action-items-view";

export default async function ActionItemsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch all action items with meeting info
  const { data: rawItems } = await supabase
    .from("action_items")
    .select("id, title, status, due_date, note, meeting_id, assignee_id, meetings(title)")
    .order("due_date", { ascending: true, nullsFirst: false });

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
      <div className="flex items-center gap-3">
        <Link href="/meetings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">액션아이템 통합 뷰</h1>
          <p className="text-muted-foreground">
            모든 회의록의 액션아이템을 한눈에 확인합니다.
          </p>
        </div>
      </div>
      <ActionItemsView actionItems={actionItems} />
    </div>
  );
}

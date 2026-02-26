import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MeetingListClient, type MeetingRow } from "@/components/meetings/meeting-list-client";

export default async function MeetingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*, users!meetings_created_by_fkey(name)")
    .order("meeting_date", { ascending: false });

  // 각 회의의 액션아이템 건수 조회
  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: actionItems } = meetingIds.length
    ? await supabase
        .from("action_items")
        .select("meeting_id, status")
        .in("meeting_id", meetingIds)
    : { data: [] };

  const aiMap = new Map<string, { total: number; completed: number }>();
  for (const ai of actionItems ?? []) {
    if (!aiMap.has(ai.meeting_id)) aiMap.set(ai.meeting_id, { total: 0, completed: 0 });
    const entry = aiMap.get(ai.meeting_id)!;
    entry.total++;
    if (ai.status === "completed") entry.completed++;
  }

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const userMap: Record<string, string> = {};
  for (const u of allUsers ?? []) {
    userMap[u.id] = u.name;
  }

  const rows: MeetingRow[] = (meetings ?? []).map((m) => {
    const ai = aiMap.get(m.id);
    return {
      id: m.id,
      title: m.title,
      content: m.content,
      meeting_date: m.meeting_date,
      attendees: (m.attendees as string[]) ?? [],
      created_by: m.created_by,
      creatorName: (m as any).users?.name ?? "-",
      actionTotal: ai?.total ?? 0,
      actionCompleted: ai?.completed ?? 0,
    };
  });

  return <MeetingListClient meetings={rows} userMap={userMap} />;
}

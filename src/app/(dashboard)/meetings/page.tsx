import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MeetingListClient, type MeetingRow } from "@/components/meetings/meeting-list-client";
import { parsePaginationParams, parseSortParams, buildPaginationRange } from "@/lib/pagination";

const SORTABLE_COLUMNS = ["meeting_date", "title"];

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const params = await searchParams;

  const { page, pageSize } = parsePaginationParams(params);
  const { sortBy, sortOrder } = parseSortParams(params, SORTABLE_COLUMNS, "meeting_date");
  const { from, to } = buildPaginationRange(page, pageSize);

  // 회의 조회 + 작성자 정보 (페이지네이션 적용)
  const { data: meetings, count } = await supabase
    .from("meetings")
    .select("*, users!meetings_created_by_fkey(name)", { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  // 액션 아이템 건수 조회
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

  return (
    <MeetingListClient
      meetings={rows}
      userMap={userMap}
      page={page}
      pageSize={pageSize}
      totalCount={count ?? 0}
      sortBy={sortBy}
      sortOrder={sortOrder}
      searchParams={params}
    />
  );
}

import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileSpreadsheet, CheckSquare } from "lucide-react";

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

  const userMap = new Map((allUsers ?? []).map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">회의록</h1>
          <p className="text-muted-foreground">
            회의록을 작성하고 액션아이템을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/meetings/action-items">
            <Button variant="outline">
              <CheckSquare className="mr-2 size-4" />
              액션아이템
            </Button>
          </Link>
          <Link href="/meetings/import">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 size-4" />
              Sheets 가져오기
            </Button>
          </Link>
          <Link href="/meetings/new">
            <Button>
              <Plus className="mr-2 size-4" />
              회의록 작성
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>날짜</TableHead>
              <TableHead>참석자</TableHead>
              <TableHead>액션아이템</TableHead>
              <TableHead>작성자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!meetings || meetings.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  아직 작성된 회의록이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((m) => {
                const ai = aiMap.get(m.id);
                const attendeeNames = (m.attendees as string[])
                  ?.map((id) => userMap.get(id))
                  .filter(Boolean)
                  .join(", ");
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/meetings/${m.id}`}
                        className="hover:underline"
                      >
                        {m.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm">
                      {attendeeNames || "-"}
                    </TableCell>
                    <TableCell>
                      {ai ? (
                        <Badge
                          variant={
                            ai.completed === ai.total ? "default" : "outline"
                          }
                        >
                          {ai.completed}/{ai.total}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(m as any).users?.name ?? "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

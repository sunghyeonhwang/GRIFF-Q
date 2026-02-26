import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, FileSpreadsheet } from "lucide-react";
import { SheetsExportButton } from "@/components/meetings/sheets-export-button";
import { PrintButton } from "@/components/meetings/print-button";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, users!meetings_created_by_fkey(name)")
    .eq("id", id)
    .single();

  if (!meeting) notFound();

  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*, users!action_items_assignee_id_fkey(name)")
    .eq("meeting_id", id)
    .order("created_at");

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const userMap = new Map((allUsers ?? []).map((u) => [u.id, u.name]));

  const attendeeNames = (meeting.attendees as string[])
    ?.map((uid) => userMap.get(uid))
    .filter(Boolean);

  const statusLabel: Record<string, string> = {
    pending: "대기",
    in_progress: "진행중",
    completed: "완료",
  };

  const statusVariant: Record<string, "outline" | "default" | "secondary"> = {
    pending: "outline",
    in_progress: "secondary",
    completed: "default",
  };

  const items = actionItems ?? [];
  const completedCount = items.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/meetings" className="no-print">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{new Date(meeting.meeting_date).toLocaleDateString("ko-KR")}</span>
              <span>·</span>
              <span>작성자: {(meeting as any).users?.name ?? "-"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <PrintButton />
          <a href={`/api/meetings/${id}/excel`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 size-4" />
              Excel
            </Button>
          </a>
          <SheetsExportButton meetingId={id} />
          <Link href={`/meetings/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 size-4" />
              수정
            </Button>
          </Link>
        </div>
      </div>

      {/* 참석자 */}
      {attendeeNames && attendeeNames.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              참석자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {attendeeNames.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 회의 내용 */}
      <Card>
        <CardHeader>
          <CardTitle>회의 내용</CardTitle>
        </CardHeader>
        <CardContent>
          {meeting.content ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {meeting.content}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">내용 없음</p>
          )}
        </CardContent>
      </Card>

      {/* 액션아이템 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>액션아이템</CardTitle>
            {items.length > 0 && (
              <Badge variant={completedCount === items.length ? "default" : "outline"}>
                {completedCount}/{items.length} 완료
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ai) => (
                  <TableRow key={ai.id}>
                    <TableCell className="font-medium text-sm">
                      {ai.title}
                    </TableCell>
                    <TableCell className="text-sm">
                      {(ai as any).users?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ai.due_date
                        ? new Date(ai.due_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[ai.status] ?? "outline"} className="text-xs">
                        {statusLabel[ai.status] ?? ai.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {ai.note || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              액션아이템 없음
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

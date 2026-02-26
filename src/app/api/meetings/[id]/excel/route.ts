import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .single();

  if (!meeting)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*, users!action_items_assignee_id_fkey(name)")
    .eq("meeting_id", id)
    .order("created_at");

  // Resolve attendee UUIDs to names
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const userMap = new Map((allUsers ?? []).map((u) => [u.id, u.name]));

  const attendeeNames = (meeting.attendees as string[])
    ?.map((uid: string) => userMap.get(uid))
    .filter(Boolean)
    .join(", ");

  const statusLabel: Record<string, string> = {
    pending: "대기",
    in_progress: "진행중",
    completed: "완료",
  };

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: 회의록
  const meetingSheet = workbook.addWorksheet("회의록");
  meetingSheet.columns = [
    { header: "항목", key: "label", width: 15 },
    { header: "내용", key: "value", width: 60 },
  ];
  meetingSheet.getRow(1).font = { bold: true };

  meetingSheet.addRow({ label: "제목", value: meeting.title });
  meetingSheet.addRow({
    label: "회의일",
    value: new Date(meeting.meeting_date).toLocaleDateString("ko-KR"),
  });
  meetingSheet.addRow({ label: "참석자", value: attendeeNames || "-" });
  meetingSheet.addRow({ label: "내용", value: meeting.content || "-" });

  // Sheet 2: 액션아이템
  const aiSheet = workbook.addWorksheet("액션아이템");
  aiSheet.columns = [
    { header: "#", key: "no", width: 6 },
    { header: "항목", key: "title", width: 30 },
    { header: "담당자", key: "assignee", width: 15 },
    { header: "마감일", key: "due_date", width: 15 },
    { header: "상태", key: "status", width: 10 },
    { header: "비고", key: "note", width: 30 },
  ];
  aiSheet.getRow(1).font = { bold: true };

  (actionItems ?? []).forEach((ai, index) => {
    aiSheet.addRow({
      no: index + 1,
      title: ai.title,
      assignee: (ai as any).users?.name ?? "-",
      due_date: ai.due_date
        ? new Date(ai.due_date).toLocaleDateString("ko-KR")
        : "-",
      status: statusLabel[ai.status] ?? ai.status,
      note: ai.note || "-",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="meeting-${id}.xlsx"`,
    },
  });
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ParsedRow {
  title: string;
  assignee: string;
  dueDate: string;
  note: string;
}

export default function MeetingImportPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);

  function parseText() {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const rows: ParsedRow[] = [];
    for (const line of lines) {
      const cols = line.split("\t");
      rows.push({
        title: cols[0] ?? "",
        assignee: cols[1] ?? "",
        dueDate: cols[2] ?? "",
        note: cols[3] ?? "",
      });
    }
    setParsed(rows);
  }

  async function save() {
    if (!meetingTitle.trim()) {
      alert("회의 제목을 입력해주세요.");
      return;
    }
    if (!meetingDate) {
      alert("회의 날짜를 입력해주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        title: meetingTitle,
        meeting_date: meetingDate,
        content: "Google Sheets 가져오기로 생성됨",
        created_by: user!.id,
      })
      .select("id")
      .single();

    if (error || !meeting) {
      alert("회의록 생성 실패: " + (error?.message ?? "unknown"));
      setLoading(false);
      return;
    }

    const validItems = parsed.filter((r) => r.title.trim());
    if (validItems.length > 0) {
      await supabase.from("action_items").insert(
        validItems.map((r) => ({
          meeting_id: meeting.id,
          title: r.title,
          note: r.note,
          status: "pending" as const,
        }))
      );
    }

    setLoading(false);
    router.push(`/meetings/${meeting.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Sheets 가져오기</h1>
        <p className="text-muted-foreground">
          Google Sheets에서 복사한 내용을 붙여넣으면 자동 파싱됩니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회의 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>회의 제목</Label>
            <Input
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="회의 제목"
            />
          </div>
          <div className="space-y-2">
            <Label>회의 날짜</Label>
            <Input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>데이터 붙여넣기</CardTitle>
          <CardDescription>
            탭으로 구분된 데이터: 항목명 / 담당자 / 마감일 / 비고
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"항목명\t담당자\t마감일\t비고\n디자인 시안 확정\t김수진\t2026-03-01\t1차 검토 완료"}
            rows={8}
          />
          <Button variant="outline" onClick={parseText}>
            파싱
          </Button>
        </CardContent>
      </Card>

      {parsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>파싱 결과 ({parsed.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목명</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.assignee}</TableCell>
                    <TableCell>{row.dueDate}</TableCell>
                    <TableCell>{row.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button onClick={save} disabled={loading}>
                {loading ? "저장 중..." : "회의록으로 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  project: string;
  category: string;
  content: string;
  task: string;
  actionTime: string;
  progressUpdate: string;
}

export default function MeetingImportPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Google Sheets 복사 시 셀 내 줄바꿈이 있으면 "따옴표"로 감싸짐
  // 이를 올바르게 파싱하는 TSV 파서
  function parseTsvWithQuotes(text: string): string[][] {
    const result: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            currentField += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          currentField += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === '\t') {
          currentRow.push(currentField.trim());
          currentField = "";
          i++;
        } else if (ch === '\n' || ch === '\r') {
          currentRow.push(currentField.trim());
          currentField = "";
          if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
            i++;
          }
          if (currentRow.some((c) => c !== "")) {
            result.push(currentRow);
          }
          currentRow = [];
          i++;
        } else {
          currentField += ch;
          i++;
        }
      }
    }

    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c !== "")) {
      result.push(currentRow);
    }

    return result;
  }

  function parseText() {
    const allRows = parseTsvWithQuotes(rawText);

    if (allRows.length === 0) return;

    // 첫 줄이 헤더인지 확인
    let startIndex = 0;
    const firstRow = allRows[0].join(" ");
    if (firstRow.includes("프로젝트") && firstRow.includes("카테고리")) {
      startIndex = 1;
    }

    const rows: ParsedRow[] = [];
    let lastProject = "";

    for (let i = startIndex; i < allRows.length; i++) {
      const cols = allRows[i];
      const project = (cols[0] ?? "").trim();
      if (project) lastProject = project;

      rows.push({
        project: lastProject,
        category: (cols[1] ?? "").trim(),
        content: (cols[2] ?? "").trim(),
        task: (cols[3] ?? "").trim(),
        actionTime: (cols[4] ?? "").trim(),
        progressUpdate: (cols[5] ?? "").trim(),
      });
    }
    setParsed(rows);
  }

  // 프로젝트별 그룹핑
  const projectGroups = parsed.reduce<Record<string, ParsedRow[]>>((acc, row) => {
    const key = row.project || "기타";
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  async function save() {
    if (!meetingTitle.trim()) {
      toast.error("회의 제목을 입력해주세요.");
      return;
    }
    if (!meetingDate) {
      toast.error("회의 날짜를 입력해주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 회의 내용: 프로젝트별로 정리
    const contentParts = Object.entries(projectGroups).map(
      ([project, rows]) => {
        const items = rows
          .map((r) => {
            const parts = [r.category, r.content].filter(Boolean);
            return `- ${parts.join(": ")}`;
          })
          .join("\n");
        return `[${project}]\n${items}`;
      }
    );

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        title: meetingTitle,
        meeting_date: meetingDate,
        content: contentParts.join("\n\n"),
        created_by: user!.id,
      })
      .select("id")
      .single();

    if (error || !meeting) {
      toast.error("회의록 생성 실패", { description: error?.message ?? "unknown" });
      setLoading(false);
      return;
    }

    // 업무가 있는 항목을 액션아이템으로 저장
    const validItems = parsed.filter((r) => r.task.trim() && r.task !== "-");
    if (validItems.length > 0) {
      await supabase.from("action_items").insert(
        validItems.map((r) => ({
          meeting_id: meeting.id,
          title: `[${r.project}] ${r.category ? r.category + " - " : ""}${r.task}`,
          note: [
            r.content && `내용: ${r.content}`,
            r.actionTime && r.actionTime !== "-" && `시간: ${r.actionTime}`,
            r.progressUpdate && `진행: ${r.progressUpdate}`,
          ]
            .filter(Boolean)
            .join("\n"),
          status: r.progressUpdate?.includes("완료") ? ("completed" as const) : ("pending" as const),
        }))
      );
    }

    setLoading(false);
    router.push(`/meetings/${meeting.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Sheets 가져오기</h1>
        <p className="text-muted-foreground">
          Google Sheets에서 복사한 회의록 데이터를 붙여넣으면 자동 파싱됩니다.
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
            Google Sheets에서 전체 선택(Ctrl+A) → 복사(Ctrl+C) → 아래에 붙여넣기(Ctrl+V)
            <br />
            컬럼: 프로젝트 구분 / 카테고리 구분 / 내용 / 업무 / 액션아이템 시간 / 진행 사항 업데이트
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"프로젝트 구분\t카테고리 구분\t내용\t업무\t액션아이템 시간\t진행 사항 업데이트\n굿즈\t볼펜\t샘플 제작 진행\t샘플 제작 전달\t다음주 미팅 전달\t협의중"}
            rows={10}
            className="font-mono text-sm"
          />
          <Button variant="outline" onClick={parseText}>
            파싱
          </Button>
        </CardContent>
      </Card>

      {parsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              파싱 결과 ({parsed.length}건, {Object.keys(projectGroups).length}개 프로젝트)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(projectGroups).map(([project, rows]) => (
              <div key={project}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="secondary">{project}</Badge>
                  <span className="text-sm text-muted-foreground">{rows.length}건</span>
                </h3>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">카테고리</TableHead>
                        <TableHead>내용</TableHead>
                        <TableHead className="w-[140px]">업무</TableHead>
                        <TableHead className="w-[140px]">액션 시간</TableHead>
                        <TableHead className="w-[140px]">진행 현황</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">
                            {row.category || "-"}
                          </TableCell>
                          <TableCell className="text-sm whitespace-pre-wrap">
                            {row.content || "-"}
                          </TableCell>
                          <TableCell className="text-sm">{row.task || "-"}</TableCell>
                          <TableCell className="text-sm">{row.actionTime || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {row.progressUpdate ? (
                              <span
                                className={
                                  row.progressUpdate.includes("완료")
                                    ? "text-green-600"
                                    : row.progressUpdate.includes("작업중") || row.progressUpdate.includes("진행")
                                      ? "text-blue-600"
                                      : ""
                                }
                              >
                                {row.progressUpdate}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <LoadingButton onClick={save} loading={loading} loadingText="저장 중...">
                회의록으로 저장
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

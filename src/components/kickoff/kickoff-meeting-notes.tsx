"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2 } from "lucide-react";
import { updateKickoff } from "@/actions/kickoff";
import { toast } from "sonner";
import type { ProjectKickoff, MeetingDecision } from "@/types/kickoff.types";

interface KickoffMeetingNotesProps {
  kickoff: ProjectKickoff;
  projectId: string;
  users: { id: string; name: string }[];
  canEdit: boolean;
}

export function KickoffMeetingNotes({ kickoff, projectId, users, canEdit }: KickoffMeetingNotesProps) {
  const [notes, setNotes] = useState(kickoff.meeting_notes ?? "");
  const [attendees, setAttendees] = useState<string[]>(kickoff.meeting_attendees ?? []);
  const [decisions, setDecisions] = useState<MeetingDecision[]>(
    kickoff.meeting_decisions ?? []
  );
  const [isPending, startTransition] = useTransition();

  const isCompleted = kickoff.status === "completed";
  const editable = canEdit && !isCompleted;

  function toggleAttendee(userId: string) {
    setAttendees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function addDecision() {
    setDecisions((prev) => [...prev, { title: "", content: "" }]);
  }

  function updateDecision(idx: number, field: "title" | "content", value: string) {
    setDecisions((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  }

  function removeDecision(idx: number) {
    setDecisions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateKickoff(kickoff.id, {
          meeting_notes: notes,
          meeting_attendees: attendees,
          meeting_decisions: decisions.filter((d) => d.title.trim()),
        });
        toast.success("미팅 기록이 저장되었습니다.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">미팅 기록</CardTitle>
        {editable && (
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            <Save className="size-3.5 mr-1" /> 저장
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 참석자 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">참석자</p>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => {
              const isSelected = attendees.includes(u.id);
              return (
                <Badge
                  key={u.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer ${editable ? "" : "pointer-events-none"}`}
                  onClick={() => editable && toggleAttendee(u.id)}
                >
                  {u.name}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* 결정사항 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">주요 결정사항</p>
            {editable && (
              <Button variant="ghost" size="sm" onClick={addDecision}>
                <Plus className="size-3 mr-1" /> 추가
              </Button>
            )}
          </div>
          {decisions.length > 0 ? (
            <div className="space-y-2">
              {decisions.map((d, idx) => (
                <div key={idx} className="flex gap-2 items-start border rounded-lg p-2">
                  <div className="flex-1 space-y-1">
                    {editable ? (
                      <>
                        <Input
                          placeholder="결정 제목"
                          value={d.title}
                          onChange={(e) => updateDecision(idx, "title", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder="상세 내용"
                          value={d.content}
                          onChange={(e) => updateDecision(idx, "content", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{d.title}</p>
                        {d.content && <p className="text-xs text-muted-foreground">{d.content}</p>}
                      </>
                    )}
                  </div>
                  {editable && (
                    <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removeDecision(idx)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">결정사항 없음</p>
          )}
        </div>

        {/* 노트 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">미팅 노트</p>
          {editable ? (
            <Textarea
              placeholder="킥오프 미팅 내용을 기록해주세요..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {notes || "미팅 노트 없음"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

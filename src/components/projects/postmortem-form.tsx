"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useFormShortcuts } from "@/hooks/use-form-shortcuts";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* --- 타입 --- */

const postmortemSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  incident_date: z.string().min(1, "발생일을 입력해주세요."),
  severity: z.string().min(1, "심각도를 선택해주세요."),
});

interface ActionItem {
  title: string;
  assignee: string;
  due_date: string;
  status: string;
}

interface TimelineEntry {
  date: string;
  time: string;
  title: string;
  description: string;
  root_cause: string;
  lessons: string[];
  actions: ActionItem[];
}

interface PostmortemData {
  id?: string;
  title: string;
  incident_date: string;
  severity: string;
  timeline: TimelineEntry[];
}

interface PostmortemFormProps {
  projectId: string;
  userId: string;
  initialData?: PostmortemData;
}

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
];

function emptyTimeline(): TimelineEntry {
  return {
    date: "",
    time: "",
    title: "",
    description: "",
    root_cause: "",
    lessons: [""],
    actions: [{ title: "", assignee: "", due_date: "", status: "open" }],
  };
}

/* --- 폼 컴포넌트 --- */

export function PostmortemForm({
  projectId,
  userId,
  initialData,
}: PostmortemFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<PostmortemData>({
    title: initialData?.title ?? "",
    incident_date: initialData?.incident_date ?? "",
    severity: initialData?.severity ?? "medium",
    timeline: initialData?.timeline?.length
      ? initialData.timeline
      : [emptyTimeline()],
  });

  const { validate, clearError, getError, hasError } = useFormErrors(postmortemSchema);
  const { markSaved } = useUnsavedChanges(form);

  const saveRef = useRef<() => void>(undefined);
  const cancelRef = useRef<() => void>(undefined);
  saveRef.current = handleSave;
  cancelRef.current = () => router.back();

  useFormShortcuts({
    onSave: useCallback(() => saveRef.current?.(), []),
    onCancel: useCallback(() => cancelRef.current?.(), []),
  });

  /* -- 타임라인 CRUD -- */

  function addEntry() {
    setForm((p) => ({ ...p, timeline: [...p.timeline, emptyTimeline()] }));
  }

  function removeEntry(idx: number) {
    if (form.timeline.length <= 1) return;
    setForm((p) => ({
      ...p,
      timeline: p.timeline.filter((_, i) => i !== idx),
    }));
  }

  function updateEntry(idx: number, field: string, value: string) {
    setForm((p) => ({
      ...p,
      timeline: p.timeline.map((e, i) =>
        i === idx ? { ...e, [field]: value } : e
      ),
    }));
  }

  /* -- 교훈 (타임라인 내부) -- */

  function addLesson(entryIdx: number) {
    setForm((p) => ({
      ...p,
      timeline: p.timeline.map((e, i) =>
        i === entryIdx ? { ...e, lessons: [...e.lessons, ""] } : e
      ),
    }));
  }

  function removeLesson(entryIdx: number, lessonIdx: number) {
    setForm((p) => ({
      ...p,
      timeline: p.timeline.map((e, i) =>
        i === entryIdx
          ? { ...e, lessons: e.lessons.filter((_, li) => li !== lessonIdx) }
          : e
      ),
    }));
  }

  function updateLesson(entryIdx: number, lessonIdx: number, value: string) {
    setForm((p) => ({
      ...p,
      timeline: p.timeline.map((e, i) =>
        i === entryIdx
          ? {
              ...e,
              lessons: e.lessons.map((l, li) => (li === lessonIdx ? value : l)),
            }
          : e
      ),
    }));
  }

  /* -- 액션 아이템 (타임라인 내부) -- */

  function addAction(entryIdx: number) {
    setForm((p) => ({
      ...p,
      timeline: p.timeline.map((e, i) =>
        i === entryIdx
          ? {
              ...e,
              actions: [
                ...e.actions,
                { title: "", assignee: "", due_date: "", status: "open" },
              ],
            }
          : e
      ),
    }));
  }

  function removeAction(entryIdx: number, actionIdx: number) {
    setForm((p) => ({
      ...p,
      timeline: p.timeline.map((e, i) =>
        i === entryIdx
          ? { ...e, actions: e.actions.filter((_, ai) => ai !== actionIdx) }
          : e
      ),
    }));
  }

  function updateAction(
    entryIdx: number,
    actionIdx: number,
    field: keyof ActionItem,
    value: string
  ) {
    setForm((p) => ({
      ...p,
      timeline: p.timeline.map((e, i) =>
        i === entryIdx
          ? {
              ...e,
              actions: e.actions.map((a, ai) =>
                ai === actionIdx ? { ...a, [field]: value } : a
              ),
            }
          : e
      ),
    }));
  }

  /* -- 저장 -- */

  async function handleSave() {
    if (!validate(form)) return;

    setLoading(true);

    // 타임라인에서 빈 교훈/액션 필터링
    const cleanedTimeline = form.timeline
      .filter((e) => e.title.trim() || e.description.trim())
      .map((e) => ({
        ...e,
        lessons: e.lessons.filter((l) => l.trim()),
        actions: e.actions.filter((a) => a.title.trim()),
      }));

    const payload = {
      project_id: projectId,
      title: form.title,
      incident_date: form.incident_date,
      severity: form.severity,
      timeline: cleanedTimeline,
      root_cause: cleanedTimeline.map((e) => e.root_cause).filter(Boolean).join("\n\n"),
      lessons_learned: cleanedTimeline.flatMap((e) => e.lessons),
      action_items: cleanedTimeline.flatMap((e) => e.actions),
      created_by: userId,
    };

    let error;

    if (initialData?.id) {
      ({ error } = await supabase
        .from("postmortems")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("postmortems").insert(payload));
    }

    setLoading(false);

    if (error) {
      toast.error("저장 실패", { description: error.message });
      return;
    }

    markSaved();
    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  /* -- 렌더링 -- */

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>제목 <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={(e) => {
                setForm((p) => ({ ...p, title: e.target.value }));
                clearError("title");
              }}
              placeholder="인시던트 제목을 입력하세요"
              className={hasError("title") ? "border-destructive" : ""}
            />
            <FieldError message={getError("title")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>발생일 <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={form.incident_date}
                onChange={(e) => {
                  setForm((p) => ({ ...p, incident_date: e.target.value }));
                  clearError("incident_date");
                }}
                className={hasError("incident_date") ? "border-destructive" : ""}
              />
              <FieldError message={getError("incident_date")} />
            </div>
            <div className="space-y-2">
              <Label>심각도 <span className="text-destructive">*</span></Label>
              <Select
                value={form.severity}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, severity: v }));
                  clearError("severity");
                }}
              >
                <SelectTrigger className={hasError("severity") ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-2 rounded-full ${opt.color}`}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={getError("severity")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 타임라인 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>타임라인 회고</CardTitle>
            <Button variant="outline" size="sm" onClick={addEntry}>
              <Plus className="mr-2 size-4" />
              타임라인 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["entry-0"]} className="space-y-4">
            {form.timeline.map((entry, idx) => (
              <AccordionItem
                key={idx}
                value={`entry-${idx}`}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left flex-1 mr-2">
                    <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {entry.title || `타임라인 ${idx + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.date && entry.time
                          ? `${entry.date} ${entry.time}`
                          : entry.date || entry.time || "날짜/시간 미입력"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* 날짜 + 시간 + 제목 */}
                  <div className="grid grid-cols-[140px_100px_1fr_40px] gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">날짜</Label>
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={(e) =>
                          updateEntry(idx, "date", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">시간</Label>
                      <Input
                        value={entry.time}
                        onChange={(e) =>
                          updateEntry(idx, "time", e.target.value)
                        }
                        placeholder="14:30"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">제목 <span className="text-destructive">*</span></Label>
                      <Input
                        value={entry.title}
                        onChange={(e) =>
                          updateEntry(idx, "title", e.target.value)
                        }
                        placeholder="이슈 제목"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEntry(idx)}
                        disabled={form.timeline.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 설명 */}
                  <div className="space-y-1">
                    <Label className="text-xs">설명</Label>
                    <Textarea
                      value={entry.description}
                      onChange={(e) =>
                        updateEntry(idx, "description", e.target.value)
                      }
                      placeholder="상황을 상세히 기술하세요"
                      rows={3}
                    />
                  </div>

                  {/* 근본 원인 */}
                  <div className="space-y-1">
                    <Label className="text-xs">근본 원인</Label>
                    <Textarea
                      value={entry.root_cause}
                      onChange={(e) =>
                        updateEntry(idx, "root_cause", e.target.value)
                      }
                      placeholder="이 이슈의 근본적인 원인을 분석하세요"
                      rows={2}
                    />
                  </div>

                  {/* 교훈 */}
                  <div className="space-y-2">
                    <Label className="text-xs">교훈</Label>
                    {entry.lessons.map((lesson, li) => (
                      <div key={li} className="flex items-center gap-2">
                        <Input
                          value={lesson}
                          onChange={(e) =>
                            updateLesson(idx, li, e.target.value)
                          }
                          placeholder={`교훈 ${li + 1}`}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => removeLesson(idx, li)}
                          disabled={entry.lessons.length <= 1}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLesson(idx)}
                    >
                      <Plus className="mr-1 size-3.5" />
                      교훈 추가
                    </Button>
                  </div>

                  {/* 액션 아이템 */}
                  <div className="space-y-2">
                    <Label className="text-xs">액션 아이템</Label>
                    {entry.actions.map((action, ai) => (
                      <div
                        key={ai}
                        className="grid grid-cols-[1fr_100px_110px_90px_32px] gap-1.5 items-start"
                      >
                        <Input
                          value={action.title}
                          onChange={(e) =>
                            updateAction(idx, ai, "title", e.target.value)
                          }
                          placeholder="조치 사항"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={action.assignee}
                          onChange={(e) =>
                            updateAction(idx, ai, "assignee", e.target.value)
                          }
                          placeholder="담당자"
                          className="h-8 text-sm"
                        />
                        <Input
                          type="date"
                          value={action.due_date}
                          onChange={(e) =>
                            updateAction(idx, ai, "due_date", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                        <Select
                          value={action.status}
                          onValueChange={(v) =>
                            updateAction(idx, ai, "status", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">미완료</SelectItem>
                            <SelectItem value="in_progress">진행중</SelectItem>
                            <SelectItem value="done">완료</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => removeAction(idx, ai)}
                          disabled={entry.actions.length <= 1}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(idx)}
                    >
                      <Plus className="mr-1 size-3.5" />
                      액션 아이템 추가
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* 저장 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "저장 중..." : initialData?.id ? "수정" : "저장"}
        </Button>
      </div>
    </div>
  );
}

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
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const meetingSchema = z.object({
  title: z.string().min(1, "회의 제목을 입력해주세요."),
  meeting_date: z.string().min(1, "회의 날짜를 입력해주세요."),
});

interface User {
  id: string;
  name: string;
}

interface ActionItem {
  id?: string;
  title: string;
  assignee_id: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed";
  note: string;
}

interface MeetingFormProps {
  userId: string;
  users: User[];
  initialData?: any;
  initialActionItems?: any[];
  readOnly?: boolean;
}

export function MeetingForm({
  userId,
  users,
  initialData,
  initialActionItems,
  readOnly = false,
}: MeetingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    meeting_date: initialData?.meeting_date ?? "",
    content: initialData?.content ?? "",
    attendees: initialData?.attendees ?? [] as string[],
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>(
    initialActionItems?.length
      ? initialActionItems.map((a: any) => ({
          id: a.id,
          title: a.title ?? "",
          assignee_id: a.assignee_id ?? "",
          due_date: a.due_date ?? "",
          status: a.status ?? "pending",
          note: a.note ?? "",
        }))
      : []
  );

  const { validate, clearError, getError, hasError } = useFormErrors(meetingSchema);
  const { markSaved } = useUnsavedChanges({ form, actionItems });

  const saveRef = useRef<() => void>(undefined);
  const cancelRef = useRef<() => void>(undefined);
  saveRef.current = save;
  cancelRef.current = () => router.back();

  useFormShortcuts({
    onSave: useCallback(() => saveRef.current?.(), []),
    onCancel: useCallback(() => cancelRef.current?.(), []),
    disabled: readOnly,
  });

  function toggleAttendee(uid: string) {
    setForm((prev) => ({
      ...prev,
      attendees: prev.attendees.includes(uid)
        ? prev.attendees.filter((id: string) => id !== uid)
        : [...prev.attendees, uid],
    }));
  }

  function addActionItem() {
    setActionItems((prev) => [
      ...prev,
      { title: "", assignee_id: "", due_date: "", status: "pending", note: "" },
    ]);
  }

  function updateActionItem(index: number, field: keyof ActionItem, value: string) {
    setActionItems((prev) => {
      const items = [...prev];
      items[index] = { ...items[index], [field]: value };
      return items;
    });
  }

  function removeActionItem(index: number) {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    if (!validate(form)) return;

    setLoading(true);
    const supabase = createClient();

    const meetingPayload = {
      title: form.title,
      meeting_date: form.meeting_date,
      content: form.content,
      attendees: form.attendees,
      created_by: userId,
    };

    let meetingId = initialData?.id;
    let error;

    if (meetingId) {
      ({ error } = await supabase
        .from("meetings")
        .update(meetingPayload)
        .eq("id", meetingId));
    } else {
      const { data, error: insertError } = await supabase
        .from("meetings")
        .insert(meetingPayload)
        .select("id")
        .single();
      error = insertError;
      meetingId = data?.id;
    }

    if (error) {
      toast.error("저장 실패", { description: error.message });
      setLoading(false);
      return;
    }

    // 액션아이템: 기존 삭제 후 재삽입
    if (initialData?.id) {
      await supabase.from("action_items").delete().eq("meeting_id", meetingId);
    }

    const validItems = actionItems.filter((a) => a.title.trim());
    if (validItems.length > 0) {
      const { error: aiError } = await supabase.from("action_items").insert(
        validItems.map((a) => ({
          meeting_id: meetingId,
          title: a.title,
          assignee_id: a.assignee_id || null,
          due_date: a.due_date || null,
          status: a.status,
          note: a.note,
        }))
      );
      if (aiError) {
        toast.error("액션아이템 저장 실패", { description: aiError.message });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    markSaved();
    router.push("/meetings");
    router.refresh();
  }

  const statusLabel: Record<string, string> = {
    pending: "대기",
    in_progress: "진행중",
    completed: "완료",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>회의 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>회의 제목 <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={(e) => {
                setForm((p) => ({ ...p, title: e.target.value }));
                clearError("title");
              }}
              placeholder="회의 제목"
              disabled={readOnly}
              className={hasError("title") ? "border-destructive" : ""}
            />
            <FieldError message={getError("title")} />
          </div>

          <div className="space-y-2">
            <Label>회의 날짜 <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.meeting_date}
              onChange={(e) => {
                setForm((p) => ({ ...p, meeting_date: e.target.value }));
                clearError("meeting_date");
              }}
              disabled={readOnly}
              className={hasError("meeting_date") ? "border-destructive" : ""}
            />
            <FieldError message={getError("meeting_date")} />
          </div>

          <div className="space-y-2">
            <Label>참석자</Label>
            <div className="flex flex-wrap gap-3">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={form.attendees.includes(u.id)}
                    onCheckedChange={() => toggleAttendee(u.id)}
                    disabled={readOnly}
                  />
                  {u.name}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>회의 내용</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="회의 내용을 작성하세요."
              rows={6}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>액션아이템</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionItems.length === 0 && (
            <p className="text-sm text-muted-foreground">
              아직 액션아이템이 없습니다.
            </p>
          )}
          {actionItems.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-3">
                  <Input
                    value={item.title}
                    onChange={(e) => updateActionItem(i, "title", e.target.value)}
                    placeholder="항목명"
                    disabled={readOnly}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={item.assignee_id}
                      onValueChange={(v) => updateActionItem(i, "assignee_id", v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="담당자" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={item.due_date}
                      onChange={(e) => updateActionItem(i, "due_date", e.target.value)}
                      disabled={readOnly}
                    />
                    <Select
                      value={item.status}
                      onValueChange={(v) => updateActionItem(i, "status", v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabel).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={item.note}
                    onChange={(e) => updateActionItem(i, "note", e.target.value)}
                    placeholder="비고"
                    disabled={readOnly}
                  />
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActionItem(i)}
                    className="shrink-0 mt-1"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addActionItem}>
              <Plus className="mr-1 size-3" />
              액션아이템 추가
            </Button>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <LoadingButton onClick={save} loading={loading} loadingText="저장 중...">
            저장
          </LoadingButton>
        </div>
      )}
    </div>
  );
}

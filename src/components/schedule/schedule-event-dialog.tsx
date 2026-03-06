"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCHEDULE_CATEGORY_CONFIG,
  type Schedule,
  type ScheduleCategory,
} from "@/types/schedule.types";

interface ScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  schedule?: Schedule;
  selectedDate?: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: ScheduleCategory;
    start_date: string;
    end_date?: string;
    is_all_day: boolean;
    start_time?: string;
    end_time?: string;
    is_public: boolean;
    target_user_id?: string;
  }) => void;
  users?: { id: string; name: string }[];
}

const ALL_CATEGORIES = Object.keys(SCHEDULE_CATEGORY_CONFIG) as ScheduleCategory[];

export function ScheduleEventDialog({
  open,
  onOpenChange,
  mode,
  schedule,
  selectedDate,
  onSubmit,
  users = [],
}: ScheduleEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ScheduleCategory>("other");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [targetUserId, setTargetUserId] = useState("");

  useEffect(() => {
    if (mode === "edit" && schedule) {
      setTitle(schedule.title);
      setDescription(schedule.description ?? "");
      setCategory(schedule.category);
      setStartDate(schedule.start_date);
      setEndDate(schedule.end_date ?? "");
      setIsAllDay(schedule.is_all_day);
      setStartTime(schedule.start_time ?? "");
      setEndTime(schedule.end_time ?? "");
      setIsPublic(schedule.is_public);
      setTargetUserId(schedule.target_user_id ?? "");
    } else if (mode === "create") {
      setTitle("");
      setDescription("");
      setCategory("other");
      setStartDate(selectedDate ?? "");
      setEndDate("");
      setIsAllDay(true);
      setStartTime("");
      setEndTime("");
      setIsPublic(true);
      setTargetUserId("");
    }
  }, [mode, schedule, selectedDate, open]);

  function handleSubmit() {
    if (!title.trim() || !startDate) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      start_date: startDate,
      end_date: endDate || undefined,
      is_all_day: isAllDay,
      start_time: !isAllDay ? startTime || undefined : undefined,
      end_time: !isAllDay ? endTime || undefined : undefined,
      is_public: isPublic,
      target_user_id: !isPublic ? targetUserId || undefined : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "일정 추가" : "일정 수정"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-1">
            <Label>제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label>설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정 설명 (선택)"
              rows={2}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label>카테고리</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ScheduleCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-3 rounded-full"
                        style={{ backgroundColor: SCHEDULE_CATEGORY_CONFIG[cat].color }}
                      />
                      {SCHEDULE_CATEGORY_CONFIG[cat].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 종일 여부 */}
          <div className="flex items-center gap-2">
            <Switch id="all-day" checked={isAllDay} onCheckedChange={setIsAllDay} />
            <Label htmlFor="all-day">종일</Label>
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>시작일 *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>종료일</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          {/* 시간 (종일 아닐 때) */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>시작 시간</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>종료 시간</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 공개 여부 */}
          <div className="flex items-center gap-2">
            <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="is-public">공개</Label>
          </div>

          {/* 대상 사용자 (비공개일 때) */}
          {!isPublic && users.length > 0 && (
            <div className="space-y-1">
              <Label>대상 사용자</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="사용자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !startDate}>
            {mode === "create" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

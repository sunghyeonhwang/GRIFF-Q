"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ScrumItem } from "@/types/scrum.types";
import { ESTIMATED_TIME_OPTIONS, PRIORITY_CONFIG } from "@/types/scrum.types";
import { updateScrumItem, completeScrum } from "@/actions/scrum";
import { ScrumTimeline } from "./scrum-timeline";
import { cn } from "@/lib/utils";

interface ScrumScheduleProps {
  scrumId: string;
  items: ScrumItem[];
  todaySchedules: { title: string; start_time: string; end_time: string }[];
  onItemsChange: (items: ScrumItem[]) => void;
  onPrev: () => void;
}

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

export function ScrumSchedule({
  scrumId,
  items,
  todaySchedules,
  onItemsChange,
  onPrev,
}: ScrumScheduleProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleTimeChange = useCallback(
    async (itemId: string, startTime: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const endTime = addMinutesToTime(startTime, item.estimated_minutes);
      const updated = items.map((i) =>
        i.id === itemId
          ? { ...i, time_block_start: startTime, time_block_end: endTime }
          : i
      );
      onItemsChange(updated);

      try {
        await updateScrumItem(itemId, {
          time_block_start: startTime,
          time_block_end: endTime,
        });
      } catch {
        onItemsChange(items);
        toast.error("시간 설정 실패");
      }
    },
    [items, onItemsChange]
  );

  const handleDurationChange = useCallback(
    async (itemId: string, minutes: number) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const endTime = item.time_block_start
        ? addMinutesToTime(item.time_block_start, minutes)
        : null;

      const updated = items.map((i) =>
        i.id === itemId
          ? { ...i, estimated_minutes: minutes, time_block_end: endTime }
          : i
      );
      onItemsChange(updated);

      try {
        await updateScrumItem(itemId, {
          estimated_minutes: minutes,
          ...(endTime ? { time_block_end: endTime } : {}),
        });
      } catch {
        onItemsChange(items);
        toast.error("소요시간 변경 실패");
      }
    },
    [items, onItemsChange]
  );

  const handleComplete = async () => {
    if (items.length === 0) {
      toast.error("항목을 1개 이상 추가하세요");
      return;
    }
    setIsCompleting(true);
    try {
      await completeScrum(scrumId);
      window.location.reload();
    } catch (err) {
      toast.error("스크럼 완성 실패");
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">항목별 시간 설정</p>
        {items.map((item) => {
          const config = PRIORITY_CONFIG[item.priority];
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 flex-wrap"
            >
              <span className={cn("text-xs", config.color)}>&#9679;</span>
              <span className="text-sm flex-1 min-w-0 truncate">{item.title}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {item.time_block_start ?? "시간 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                    {TIME_SLOTS.map((t) => (
                      <Button
                        key={t}
                        variant={item.time_block_start === t ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleTimeChange(item.id, t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Select
                value={String(item.estimated_minutes)}
                onValueChange={(v) => handleDurationChange(item.id, Number(v))}
              >
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTIMATED_TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <ScrumTimeline items={items} schedules={todaySchedules} />

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <Button onClick={handleComplete} disabled={isCompleting}>
          <CheckCircle className="h-4 w-4 mr-1" />
          {isCompleting ? "처리 중..." : "스크럼 완성"}
        </Button>
      </div>
    </div>
  );
}

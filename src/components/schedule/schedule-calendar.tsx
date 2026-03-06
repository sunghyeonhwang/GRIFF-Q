"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ScheduleViewToggle, type ScheduleViewType } from "./schedule-view-toggle";
import { ScheduleSidebar } from "./schedule-sidebar";
import { ScheduleEventDialog } from "./schedule-event-dialog";
import { ScheduleEventCard } from "./schedule-event-card";
import { createSchedule, updateSchedule, deleteSchedule } from "@/actions/schedule";
import {
  SCHEDULE_CATEGORY_CONFIG,
  type Schedule,
  type ScheduleCategory,
} from "@/types/schedule.types";

interface ScheduleCalendarProps {
  schedules: Schedule[];
  userId: string;
  users: { id: string; name: string }[];
}

const FC_VIEW_MAP: Record<ScheduleViewType, string> = {
  month: "dayGridMonth",
  week: "timeGridWeek",
  day: "timeGridDay",
};

export function ScheduleCalendar({ schedules, userId, users }: ScheduleCalendarProps) {
  const [view, setView] = useState<ScheduleViewType>("month");
  const [activeCategories, setActiveCategories] = useState<Set<ScheduleCategory>>(
    new Set(Object.keys(SCHEDULE_CATEGORY_CONFIG) as ScheduleCategory[])
  );
  const [isMyScheduleOnly, setIsMyScheduleOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // 필터링된 이벤트
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (!activeCategories.has(s.category)) return false;
      if (isMyScheduleOnly && s.created_by !== userId) return false;
      return true;
    });
  }, [schedules, activeCategories, isMyScheduleOnly, userId]);

  // FullCalendar 이벤트 변환
  const events = useMemo(() => {
    return filteredSchedules.map((s) => {
      const color = s.color || SCHEDULE_CATEGORY_CONFIG[s.category].color;
      return {
        id: s.id,
        title: s.title,
        start: s.is_all_day ? s.start_date : `${s.start_date}T${s.start_time}`,
        end: s.end_date
          ? s.is_all_day
            ? s.end_date
            : s.end_time
              ? `${s.end_date}T${s.end_time}`
              : s.end_date
          : undefined,
        allDay: s.is_all_day,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { schedule: s },
      };
    });
  }, [filteredSchedules]);

  function handleCategoryToggle(cat: ScheduleCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleDateClick(arg: DateClickArg) {
    setDialogMode("create");
    setSelectedSchedule(undefined);
    setSelectedDate(arg.dateStr.split("T")[0]);
    setDialogOpen(true);
  }

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const schedule = arg.event.extendedProps.schedule as Schedule;
    setSelectedSchedule(schedule);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  function handleCreate() {
    setDialogMode("create");
    setSelectedSchedule(undefined);
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setDialogOpen(true);
  }

  function handleSubmit(data: Parameters<typeof createSchedule>[0]) {
    startTransition(async () => {
      try {
        if (dialogMode === "create") {
          await createSchedule(data);
          toast.success("일정이 추가되었습니다.");
        } else if (selectedSchedule) {
          await updateSchedule(selectedSchedule.id, data);
          toast.success("일정이 수정되었습니다.");
        }
        setDialogOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  function handleDelete() {
    if (!selectedSchedule) return;
    startTransition(async () => {
      try {
        await deleteSchedule(selectedSchedule.id);
        toast.success("일정이 삭제되었습니다.");
        setDialogOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* 사이드바 */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">필터</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleSidebar
              activeCategories={activeCategories}
              onToggle={handleCategoryToggle}
              isMyScheduleOnly={isMyScheduleOnly}
              onMyScheduleToggle={() => setIsMyScheduleOnly((v) => !v)}
            />
          </CardContent>
        </Card>
      </div>

      {/* 캘린더 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium whitespace-nowrap">일정 캘린더</CardTitle>
            <div className="flex items-center gap-2">
              <ScheduleViewToggle currentView={view} onViewChange={setView} />
              <Button size="sm" onClick={handleCreate}>
                <Plus className="size-3.5 mr-1" /> 추가
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="fc-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={FC_VIEW_MAP[view]}
              key={view}
              locale="ko"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="auto"
              dayMaxEvents={3}
              nowIndicator
              selectable
            />
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 다이얼로그 */}
      <ScheduleEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        schedule={selectedSchedule}
        selectedDate={selectedDate}
        onSubmit={handleSubmit}
        users={users}
      />
    </div>
  );
}

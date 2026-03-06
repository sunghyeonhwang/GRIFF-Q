"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProject {
  id: string;
  name: string;
  status: string;
  end_date: string | null;
  start_date: string | null;
  progress?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500",
  completed: "bg-green-500",
  on_hold: "bg-gray-400",
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

interface ProjectCalendarViewProps {
  items: CalendarProject[];
}

export function ProjectCalendarView({ items }: ProjectCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: number; isCurrentMonth: boolean; dateStr: string }[] =
      [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }

    // Next month padding
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        days.push({
          date: d,
          isCurrentMonth: false,
          dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        });
      }
    }

    return days;
  }, [year, month]);

  // Map projects by end_date
  const projectsByDate = useMemo(() => {
    const map = new Map<string, CalendarProject[]>();
    for (const item of items) {
      if (item.end_date) {
        const dateKey = item.end_date.slice(0, 10);
        const existing = map.get(dateKey) ?? [];
        existing.push(item);
        map.set(dateKey, existing);
      }
    }
    return map;
  }, [items]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function goToPrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">
          {year}년 {month + 1}월
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={goToPrevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={goToNextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day names header */}
        <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-1">
          {DAY_NAMES.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-l">
          {calendarDays.map((day, idx) => {
            const dayProjects = projectsByDate.get(day.dateStr) ?? [];
            const isToday = day.dateStr === todayStr;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[80px] md:min-h-[100px] border-r border-b p-1 text-xs",
                  !day.isCurrentMonth && "bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "inline-flex items-center justify-center size-6 rounded-full text-xs mb-1",
                    isToday && "bg-brand text-brand-foreground font-bold",
                    !day.isCurrentMonth && "text-muted-foreground",
                  )}
                >
                  {day.date}
                </div>
                <div className="space-y-0.5">
                  {dayProjects.slice(0, 3).map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block"
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded px-1 py-0.5 truncate",
                          "hover:bg-muted transition-colors",
                        )}
                      >
                        <div
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            STATUS_COLORS[project.status] ?? "bg-gray-400",
                          )}
                        />
                        <span className="truncate">{project.name}</span>
                      </div>
                    </Link>
                  ))}
                  {dayProjects.length > 3 && (
                    <div className="text-muted-foreground px-1">
                      +{dayProjects.length - 3}개
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

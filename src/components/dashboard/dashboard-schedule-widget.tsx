"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

interface ScheduleItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  category: string;
}

interface DashboardScheduleWidgetProps {
  schedules: ScheduleItem[];
}

function formatTime(timeStr: string): string {
  // timeStr can be "HH:mm:ss" or "HH:mm"
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

const CATEGORY_LABEL: Record<string, string> = {
  meeting: "회의",
  work: "업무",
  personal: "개인",
  holiday: "휴일",
  deadline: "마감",
};

export function DashboardScheduleWidget({ schedules }: DashboardScheduleWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-card-title">오늘 일정</CardTitle>
        <CalendarDays className="size-4 text-brand" />
      </CardHeader>
      <CardContent className="space-y-2">
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2 text-center">오늘 일정 없음</p>
        ) : (
          <div className="space-y-2">
            {schedules.slice(0, 5).map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    {formatTime(schedule.start_time)}~{formatTime(schedule.end_time)}
                  </p>
                  <p className="font-medium truncate">{schedule.title}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {CATEGORY_LABEL[schedule.category] ?? schedule.category}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="pt-1">
          <Link href="/schedule" className="text-xs text-brand hover:underline">
            전체 보기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

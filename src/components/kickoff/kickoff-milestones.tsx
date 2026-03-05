"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface KickoffMilestonesProps {
  project: { start_date: string | null; end_date: string | null; name: string };
  kickoffDate: string | null;
}

interface MilestonePoint {
  label: string;
  date: string;
  position: number; // 0-100
  isKickoff: boolean;
  isPast: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function KickoffMilestones({ project, kickoffDate }: KickoffMilestonesProps) {
  if (!project.start_date || !project.end_date) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>마일스톤</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="size-4" />
            프로젝트 일정이 설정되지 않았습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const startMs = new Date(project.start_date).getTime();
  const endMs = new Date(project.end_date).getTime();
  const rangeMs = Math.max(endMs - startMs, 1);
  const now = Date.now();

  function getPosition(dateStr: string) {
    const ms = new Date(dateStr).getTime();
    return Math.max(0, Math.min(100, ((ms - startMs) / rangeMs) * 100));
  }

  const points: MilestonePoint[] = [
    {
      label: "시작",
      date: project.start_date,
      position: 0,
      isKickoff: false,
      isPast: now >= startMs,
    },
  ];

  if (kickoffDate) {
    points.push({
      label: "킥오프",
      date: kickoffDate,
      position: getPosition(kickoffDate),
      isKickoff: true,
      isPast: now >= new Date(kickoffDate).getTime(),
    });
  }

  points.push({
    label: "종료",
    date: project.end_date,
    position: 100,
    isKickoff: false,
    isPast: now >= endMs,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>마일스톤</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop: horizontal */}
        <div className="hidden md:block">
          <div className="relative h-16">
            {/* Timeline line */}
            <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-border" />

            {points.map((pt, i) => {
              const isFirst = i === 0;
              const isLast = i === points.length - 1;
              const align = isFirst ? "items-start" : isLast ? "items-end" : "items-center";
              const translate = isFirst ? "" : isLast ? "-translate-x-full" : "-translate-x-1/2";

              return (
                <div
                  key={i}
                  className={`absolute flex flex-col ${align} ${translate}`}
                  style={{ left: `${pt.position}%`, top: 0 }}
                >
                  <div
                    className={`size-3 rounded-full border-2 ${
                      pt.isKickoff
                        ? "bg-primary border-primary"
                        : pt.isPast
                          ? "bg-primary border-primary"
                          : "bg-muted border-muted"
                    }`}
                  />
                  <span className="mt-1.5 text-xs font-medium whitespace-nowrap">
                    {pt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(pt.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden space-y-0">
          {points.map((pt, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`size-3 rounded-full border-2 ${
                    pt.isKickoff
                      ? "bg-primary border-primary"
                      : pt.isPast
                        ? "bg-primary border-primary"
                        : "bg-muted border-muted"
                  }`}
                />
                {i < points.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium">{pt.label}</p>
                <p className="text-xs text-muted-foreground">{formatDate(pt.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

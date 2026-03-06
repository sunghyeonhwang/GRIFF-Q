"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GanttProject {
  id: string;
  name: string;
  status: string;
  progress?: number | null;
  start_date: string | null;
  end_date: string | null;
  color?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500 dark:bg-blue-400",
  completed: "bg-green-500 dark:bg-green-400",
  on_hold: "bg-gray-400 dark:bg-gray-500",
};

const STATUS_BG_COLORS: Record<string, string> = {
  active: "bg-blue-200 dark:bg-blue-900",
  completed: "bg-green-200 dark:bg-green-900",
  on_hold: "bg-gray-200 dark:bg-gray-800",
};

interface ProjectGanttViewProps {
  items: GanttProject[];
}

export function ProjectGanttView({ items }: ProjectGanttViewProps) {
  // Filter projects that have both start/end dates
  const validProjects = useMemo(
    () => items.filter((p) => p.start_date && p.end_date),
    [items],
  );

  const { timeRange, months } = useMemo(() => {
    if (validProjects.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      return {
        timeRange: { start, end, totalDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) },
        months: [{ label: `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}`, start }],
      };
    }

    const dates = validProjects.flatMap((p) => [
      new Date(p.start_date!),
      new Date(p.end_date!),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add some padding
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );

    // Generate month markers
    const monthsList: { label: string; start: Date }[] = [];
    const current = new Date(start);
    while (current <= end) {
      monthsList.push({
        label: `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, "0")}`,
        start: new Date(current),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return { timeRange: { start, end, totalDays }, months: monthsList };
  }, [validProjects]);

  function getBarPosition(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const offsetDays = Math.max(
      0,
      Math.ceil(
        (start.getTime() - timeRange.start.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const durationDays = Math.max(
      1,
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const left = (offsetDays / timeRange.totalDays) * 100;
    const width = (durationDays / timeRange.totalDays) * 100;

    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  }

  const noDataProjects = items.filter((p) => !p.start_date || !p.end_date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">간트 차트</CardTitle>
      </CardHeader>
      <CardContent>
        {validProjects.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            시작일과 종료일이 설정된 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Month headers */}
              <div className="relative h-8 border-b mb-2">
                {months.map((m) => {
                  const offsetDays = Math.max(
                    0,
                    Math.ceil(
                      (m.start.getTime() - timeRange.start.getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  );
                  const left = (offsetDays / timeRange.totalDays) * 100;
                  return (
                    <div
                      key={m.label}
                      className="absolute top-0 text-xs text-muted-foreground border-l pl-1 h-full flex items-center"
                      style={{ left: `${left}%` }}
                    >
                      {m.label}
                    </div>
                  );
                })}
              </div>

              {/* Project bars */}
              <div className="space-y-2">
                {validProjects.map((project) => {
                  const pos = getBarPosition(
                    project.start_date!,
                    project.end_date!,
                  );
                  const progress = project.progress ?? 0;

                  return (
                    <div key={project.id} className="flex items-center gap-3">
                      {/* Label */}
                      <div className="w-[140px] shrink-0 truncate">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm hover:underline truncate"
                        >
                          {project.name}
                        </Link>
                      </div>

                      {/* Bar area */}
                      <div className="relative flex-1 h-7">
                        <div
                          className={cn(
                            "absolute top-0 h-full rounded-md overflow-hidden",
                            STATUS_BG_COLORS[project.status] ?? "bg-gray-200 dark:bg-gray-800",
                          )}
                          style={{
                            left: pos.left,
                            width: pos.width,
                          }}
                        >
                          {/* Progress fill */}
                          <div
                            className={cn(
                              "h-full rounded-md transition-all",
                              STATUS_COLORS[project.status] ?? "bg-gray-400",
                            )}
                            style={{ width: `${progress}%` }}
                          />
                          {/* Label overlay */}
                          <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white mix-blend-difference truncate">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Projects without dates */}
        {noDataProjects.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              날짜 미설정 ({noDataProjects.length}건)
            </p>
            <div className="flex flex-wrap gap-2">
              {noDataProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <Badge variant="outline" className="text-xs hover:bg-muted">
                    {p.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

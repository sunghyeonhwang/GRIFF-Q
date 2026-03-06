"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task.types";
import { TASK_STATUS_CONFIG } from "@/types/task.types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-500 dark:bg-gray-400",
  in_progress: "bg-blue-500 dark:bg-blue-400",
  review: "bg-yellow-500 dark:bg-yellow-400",
  completed: "bg-green-500 dark:bg-green-400",
  issue: "bg-red-500 dark:bg-red-400",
};

const STATUS_BG_COLORS: Record<string, string> = {
  pending: "bg-gray-200 dark:bg-gray-800",
  in_progress: "bg-blue-200 dark:bg-blue-900",
  review: "bg-yellow-200 dark:bg-yellow-900",
  completed: "bg-green-200 dark:bg-green-900",
  issue: "bg-red-200 dark:bg-red-900",
};

interface TaskGanttViewProps {
  tasks: Task[];
}

export function TaskGanttView({ tasks }: TaskGanttViewProps) {
  // Use created_at as start, due_date as end
  const validTasks = useMemo(
    () => tasks.filter((t) => t.due_date),
    [tasks],
  );

  const { timeRange, months } = useMemo(() => {
    if (validTasks.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      return {
        timeRange: {
          start,
          end,
          totalDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        },
        months: [
          {
            label: `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}`,
            start,
          },
        ],
      };
    }

    const dates = validTasks.flatMap((t) => {
      const start = new Date(t.created_at);
      const end = new Date(t.due_date!);
      return [start, end];
    });
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );

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
  }, [validTasks]);

  function getBarPosition(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const offsetDays = Math.max(
      0,
      Math.ceil(
        (start.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24),
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

  const noDateTasks = tasks.filter((t) => !t.due_date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Task 간트 차트</CardTitle>
      </CardHeader>
      <CardContent>
        {validTasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            마감일이 설정된 Task가 없습니다.
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

              {/* Task bars */}
              <div className="space-y-2">
                {validTasks.map((task) => {
                  const pos = getBarPosition(task.created_at, task.due_date!);

                  return (
                    <div key={task.id} className="flex items-center gap-3">
                      {/* Label */}
                      <div className="w-[160px] shrink-0 truncate flex items-center gap-2">
                        <span className="text-sm truncate">{task.title}</span>
                        {task.assignee && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {task.assignee.name}
                          </span>
                        )}
                      </div>

                      {/* Bar area */}
                      <div className="relative flex-1 h-7">
                        <div
                          className={cn(
                            "absolute top-0 h-full rounded-md overflow-hidden",
                            STATUS_BG_COLORS[task.status] ?? "bg-gray-200 dark:bg-gray-800",
                          )}
                          style={{
                            left: pos.left,
                            width: pos.width,
                          }}
                        >
                          <div
                            className={cn(
                              "h-full rounded-md",
                              STATUS_COLORS[task.status] ?? "bg-gray-400",
                            )}
                            style={{ width: "100%" }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white mix-blend-difference truncate">
                            {TASK_STATUS_CONFIG[task.status]?.label}
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

        {/* Tasks without due_date */}
        {noDateTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              마감일 미설정 ({noDateTasks.length}건)
            </p>
            <div className="flex flex-wrap gap-2">
              {noDateTasks.map((t) => (
                <Badge key={t.id} variant="outline" className="text-xs">
                  {t.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
          {Object.entries(TASK_STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={cn("size-2 rounded-md", STATUS_COLORS[key])} />
              {cfg.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

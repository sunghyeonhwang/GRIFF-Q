"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";
import Link from "next/link";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface DashboardTasksWidgetProps {
  tasks: TaskItem[];
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  urgent: "destructive",
  high: "default",
  normal: "secondary",
  low: "outline",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "긴급",
  high: "높음",
  normal: "보통",
  low: "낮음",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "대기",
  in_progress: "진행중",
  review: "리뷰",
  issue: "이슈",
};

export function DashboardTasksWidget({ tasks }: DashboardTasksWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-card-title">오늘 마감 태스크</CardTitle>
        <CheckSquare className="size-4 text-brand" />
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2 text-center">
            오늘 마감 태스크 없음
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs text-muted-foreground shrink-0">
                    {STATUS_LABEL[task.status] ?? task.status}
                  </span>
                  <span className="truncate font-medium">{task.title}</span>
                </div>
                <Badge
                  variant={PRIORITY_VARIANT[task.priority] ?? "outline"}
                  className="text-xs shrink-0"
                >
                  {PRIORITY_LABEL[task.priority] ?? task.priority}
                </Badge>
              </Link>
            ))}
          </div>
        )}
        <div className="pt-1">
          <Link href="/tasks" className="text-xs text-brand hover:underline">
            전체 보기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

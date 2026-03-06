"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
} from "lucide-react";
import type { Task, TaskStatus } from "@/types/task.types";
import { TASK_STATUS_CONFIG } from "@/types/task.types";

interface DependencyOverviewProps {
  tasks: Task[];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "#9ca3af",
  in_progress: "#3b82f6",
  review: "#eab308",
  completed: "#22c55e",
  issue: "#ef4444",
};

export function DependencyOverview({ tasks }: DependencyOverviewProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const overdue = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== "completed"
    ).length;

    return { total, completed, inProgress, overdue };
  }, [tasks]);

  // 상태별 분포 (도넛 차트)
  const statusData = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      pending: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      issue: 0,
    };
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: TASK_STATUS_CONFIG[status as TaskStatus].label,
        value: count,
        color: STATUS_COLORS[status as TaskStatus],
      }));
  }, [tasks]);

  // 담당자별 부하 (바 차트)
  const assigneeData = useMemo(() => {
    const map = new Map<string, { name: string; total: number; completed: number }>();

    tasks.forEach((t) => {
      const name = t.assignee?.name || "미배정";
      const key = t.assignee_id || "__unassigned__";
      const existing = map.get(key) || { name, total: 0, completed: 0 };
      existing.total += 1;
      if (t.status === "completed") existing.completed += 1;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BarChart3 className="size-3.5" />
          개요
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[360px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>의존성 맵 개요</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon={ListTodo}
              label="전체"
              value={stats.total}
              className="text-foreground"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="완료"
              value={stats.completed}
              className="text-green-600 dark:text-green-400"
            />
            <SummaryCard
              icon={Clock}
              label="진행중"
              value={stats.inProgress}
              className="text-blue-600 dark:text-blue-400"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="지연"
              value={stats.overdue}
              className="text-red-600 dark:text-red-400"
            />
          </div>

          {/* 도넛 차트 — 상태 분포 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">상태 분포</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}개`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {statusData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground flex-1">
                          {entry.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {entry.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Task가 없습니다
                </p>
              )}
            </CardContent>
          </Card>

          {/* 바 차트 — 담당자별 부하 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">담당자별 부하</CardTitle>
            </CardHeader>
            <CardContent>
              {assigneeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(assigneeData.length * 32, 100)}>
                  <BarChart
                    data={assigneeData}
                    layout="vertical"
                    margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={64}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `${value}개`,
                        name === "completed" ? "완료" : "전체",
                      ]}
                    />
                    <Bar
                      dataKey="total"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={14}
                      name="전체"
                    />
                    <Bar
                      dataKey="completed"
                      fill="#22c55e"
                      radius={[0, 4, 4, 0]}
                      barSize={14}
                      name="완료"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Task가 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={`size-5 ${className}`} />
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

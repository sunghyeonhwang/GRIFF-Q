import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarDays, Milestone, Circle, CheckCircle2 } from "lucide-react";
import type { ProjectMilestone } from "@/types/project.types";
import type { Task } from "@/types/task.types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function diffDays(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, start_date, end_date, status, progress")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const [milestonesRes, tasksRes] = await Promise.all([
    supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", id)
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, milestone_id, priority, assignee_id")
      .eq("project_id", id)
      .is("parent_task_id", null)
      .order("due_date", { ascending: true }),
  ]);

  const milestones = (milestonesRes.data ?? []) as ProjectMilestone[];
  const tasks = (tasksRes.data ?? []) as Task[];

  // 마일스톤별 Task 그룹
  const tasksByMilestone = milestones.reduce<Record<string, Task[]>>((acc, m) => {
    acc[m.id] = tasks.filter((t) => t.milestone_id === m.id);
    return acc;
  }, {});
  const unassignedTasks = tasks.filter((t) => !t.milestone_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">타임라인</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
        </div>
        {project.start_date && project.end_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>
              {formatDate(project.start_date)} ~ {formatDate(project.end_date)}
            </span>
          </div>
        )}
      </div>

      {/* Progress overview */}
      {typeof project.progress === "number" && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">전체 진행률</span>
            <span className="text-muted-foreground">{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(project.progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestone timeline */}
      {milestones.length === 0 && unassignedTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Milestone className="size-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">마일스톤이 없습니다</p>
          <p className="text-sm mt-1">
            프로젝트 허브에서 마일스톤을 추가하세요.
          </p>
          <Link href={`/projects/${id}`} className="mt-3 inline-block">
            <Button variant="outline" size="sm">
              프로젝트 허브로 이동
            </Button>
          </Link>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* 마일스톤 목록 */}
          {milestones.map((milestone, idx) => {
            const milestoneTasks = tasksByMilestone[milestone.id] ?? [];
            const completedCount = milestoneTasks.filter(
              (t) => t.status === "completed"
            ).length;
            const daysLeft = milestone.due_date ? diffDays(milestone.due_date) : null;
            const isOverdue =
              daysLeft !== null && daysLeft < 0 && milestone.status !== "completed";

            return (
              <Card key={milestone.id} className="relative">
                {/* 타임라인 연결선 */}
                {idx < milestones.length - 1 && (
                  <div className="absolute left-6 top-full h-4 w-px bg-border z-10" />
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle
                          className={`size-5 shrink-0 ${
                            isOverdue ? "text-destructive" : "text-muted-foreground"
                          }`}
                        />
                      )}
                      <CardTitle className="text-base">{milestone.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {milestone.status === "completed" ? (
                        <Badge variant="secondary" className="text-green-600 bg-green-50 dark:bg-green-950/30">
                          완료
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive">지연</Badge>
                      ) : (
                        <Badge variant="outline">진행중</Badge>
                      )}
                      {milestone.due_date && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(milestone.due_date)}
                          {daysLeft !== null && milestone.status !== "completed" && (
                            <span
                              className={`ml-1 ${
                                isOverdue ? "text-destructive" : ""
                              }`}
                            >
                              ({isOverdue ? `${Math.abs(daysLeft)}일 초과` : `D-${daysLeft}`})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {milestoneTasks.length > 0 && (
                  <CardContent className="pt-0 space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Task {completedCount}/{milestoneTasks.length}건 완료
                    </div>
                    <div className="space-y-1.5">
                      {milestoneTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="size-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={
                              task.status === "completed"
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {task.title}
                          </span>
                          {task.due_date && (
                            <span className="ml-auto text-xs text-muted-foreground shrink-0">
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* 마일스톤 미배정 Task */}
          {unassignedTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">
                  마일스톤 미배정 Task ({unassignedTasks.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {unassignedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

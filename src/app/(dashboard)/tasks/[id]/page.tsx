import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  FolderOpen,
  Weight,
  Tag,
} from "lucide-react";
import { TaskDetailClient } from "./task-detail-client";
import type { Task } from "@/types/task.types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select(
      "*, assignee:users!tasks_assignee_id_fkey(id, name, email), project:projects!tasks_project_id_fkey(id, name)"
    )
    .eq("id", id)
    .single();

  if (!task) notFound();

  // Subtasks
  const { data: subtasks } = await supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assignee_id_fkey(name, email)")
    .eq("parent_task_id", id)
    .order("sort_order", { ascending: true });

  // Dependencies
  const { data: depRows } = await supabase
    .from("task_dependencies")
    .select("*")
    .or(`task_id.eq.${id},depends_on_id.eq.${id}`);

  const blockedByIds = (depRows ?? [])
    .filter((d) => d.task_id === id)
    .map((d) => d.depends_on_id);
  const blocksIds = (depRows ?? [])
    .filter((d) => d.depends_on_id === id)
    .map((d) => d.task_id);

  const [blockedByRes, blocksRes] = await Promise.all([
    blockedByIds.length > 0
      ? supabase.from("tasks").select("id, title, status").in("id", blockedByIds)
      : Promise.resolve({ data: [] }),
    blocksIds.length > 0
      ? supabase.from("tasks").select("id, title, status").in("id", blocksIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Users for editing
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedTask = task as Task & { assignee?: { id: string; name: string }; project?: { id: string; name: string } };
  const users = allUsers ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={typedTask.project ? `/projects/${typedTask.project.id}/tasks` : "/tasks"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{typedTask.title}</h1>
          {typedTask.project && (
            <Link
              href={`/projects/${typedTask.project.id}`}
              className="text-sm text-muted-foreground hover:underline mt-0.5 inline-flex items-center gap-1"
            >
              <FolderOpen className="size-3" />
              {typedTask.project.name}
            </Link>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{typedTask.status}</Badge>
        <Badge variant="secondary">{typedTask.priority}</Badge>
        {(typedTask.labels ?? []).map((label) => (
          <Badge key={label} variant="outline" className="gap-1">
            <Tag className="size-3" />
            {label}
          </Badge>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: detail */}
        <div className="md:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">설명</CardTitle>
            </CardHeader>
            <CardContent>
              {typedTask.description ? (
                <p className="text-sm whitespace-pre-wrap">{typedTask.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">설명 없음</p>
              )}
            </CardContent>
          </Card>

          {/* Subtasks */}
          {(subtasks ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  서브태스크 ({subtasks?.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(subtasks ?? []).map((sub) => (
                  <Link key={sub.id} href={`/tasks/${sub.id}`}>
                    <div className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span
                        className={
                          sub.status === "completed"
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {sub.title}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {sub.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dependencies */}
          {((blockedByRes.data ?? []).length > 0 ||
            (blocksRes.data ?? []).length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">의존성</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(blockedByRes.data ?? []).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      선행 Task (완료 후 시작 가능)
                    </p>
                    {(blockedByRes.data ?? []).map((t) => (
                      <Link key={t.id} href={`/tasks/${t.id}`}>
                        <div className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/50">
                          {t.title}
                          <Badge variant="outline" className="ml-auto text-xs">
                            {t.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {(blockedByRes.data ?? []).length > 0 &&
                  (blocksRes.data ?? []).length > 0 && <Separator />}
                {(blocksRes.data ?? []).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      후행 Task (이 Task 완료 후 시작)
                    </p>
                    {(blocksRes.data ?? []).map((t) => (
                      <Link key={t.id} href={`/tasks/${t.id}`}>
                        <div className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/50">
                          {t.title}
                          <Badge variant="outline" className="ml-auto text-xs">
                            {t.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: meta info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">상세 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">담당자</span>
                <span className="ml-auto font-medium">
                  {typedTask.assignee?.name ?? "미배정"}
                </span>
              </div>
              {typedTask.due_date && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">마감일</span>
                  <span className="ml-auto font-medium">
                    {formatDate(typedTask.due_date)}
                  </span>
                </div>
              )}
              {typedTask.estimated_hours != null && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">예상 시간</span>
                  <span className="ml-auto font-medium">
                    {typedTask.estimated_hours}h
                  </span>
                </div>
              )}
              {typedTask.actual_hours != null && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">실제 시간</span>
                  <span className="ml-auto font-medium">
                    {typedTask.actual_hours}h
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Weight className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">가중치</span>
                <span className="ml-auto font-medium">{typedTask.weight}</span>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                생성: {formatDate(typedTask.created_at)}
              </div>
              {typedTask.completed_at && (
                <div className="text-xs text-muted-foreground">
                  완료: {formatDate(typedTask.completed_at)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit actions (Client Component) */}
          <TaskDetailClient task={typedTask as Task} users={users} />
        </div>
      </div>
    </div>
  );
}

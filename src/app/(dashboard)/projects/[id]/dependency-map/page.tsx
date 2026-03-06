import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitBranch } from "lucide-react";
import { DependencyMapCanvas } from "@/components/tasks/dependency-map/dependency-map-canvas";
import type { Task, TaskDependency } from "@/types/task.types";

export default async function DependencyMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  // 프로젝트 조회
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Task + 의존성 + 멤버 병렬 조회
  const [tasksRes, depsRes, membersRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, users!tasks_assignee_id_fkey(name, email)")
      .eq("project_id", id)
      .is("parent_task_id", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("task_dependencies")
      .select("*")
      .in(
        "task_id",
        (
          await supabase
            .from("tasks")
            .select("id")
            .eq("project_id", id)
        ).data?.map((t) => t.id) || []
      ),
    supabase
      .from("project_members")
      .select("user_id, users!project_members_user_id_fkey(name)")
      .eq("project_id", id),
  ]);

  // Task에 assignee 정보 매핑
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks: Task[] = (tasksRes.data ?? []).map((t: any) => ({
    ...t,
    assignee: t.users
      ? { name: t.users.name, email: t.users.email }
      : undefined,
  }));

  const dependencies: TaskDependency[] = (depsRes.data ?? []) as TaskDependency[];

  // 멤버 -> User 목록 (중복 제거)
  const userMap = new Map<string, { id: string; name: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (membersRes.data ?? []).forEach((m: any) => {
    if (m.user_id && m.users?.name) {
      userMap.set(m.user_id, { id: m.user_id, name: m.users.name });
    }
  });
  const users = Array.from(userMap.values());

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <GitBranch className="size-5 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <p className="text-xs text-muted-foreground">
                의존성 맵 — {tasks.length}개 Task, {dependencies.length}개 연결
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <DependencyMapCanvas
          tasks={tasks}
          dependencies={dependencies}
          projectId={id}
          users={users}
        />
      </div>
    </div>
  );
}

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskFilterTabs, type TaskFilter } from "@/components/tasks/task-filter-tabs";
import { TaskViewToggle, type TaskViewType } from "@/components/tasks/task-view-toggle";
import { TaskList } from "@/components/tasks/task-list";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { TaskGanttView } from "@/components/tasks/task-gantt-view";
import { TaskNodeView } from "@/components/tasks/task-node-view";
import { ClipboardList } from "lucide-react";
import { notFound } from "next/navigation";
import type { Task, TaskDependency } from "@/types/task.types";

const VALID_FILTERS: TaskFilter[] = ["all", "today", "upcoming", "completed", "my"];
const VALID_VIEWS: TaskViewType[] = ["list", "board", "calendar", "gantt", "node"];

export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { id: projectId } = await params;
  const sp = await searchParams;

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projectError || !project) notFound();

  // Parse params
  const rawFilter = typeof sp.filter === "string" ? sp.filter : "all";
  const filter: TaskFilter = VALID_FILTERS.includes(rawFilter as TaskFilter)
    ? (rawFilter as TaskFilter)
    : "all";

  const rawView = typeof sp.view === "string" ? sp.view : "list";
  const view: TaskViewType = VALID_VIEWS.includes(rawView as TaskViewType)
    ? (rawView as TaskViewType)
    : "list";

  // Build query
  let query = supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assignee_id_fkey(name, email)")
    .eq("project_id", projectId)
    .is("parent_task_id", null)
    .order("sort_order", { ascending: true });

  const today = new Date().toISOString().split("T")[0];

  if (filter === "today") {
    query = query.eq("due_date", today);
  } else if (filter === "upcoming") {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];
    query = query.gte("due_date", today).lte("due_date", nextWeekStr);
  } else if (filter === "completed") {
    query = query.eq("status", "completed");
  } else if (filter === "my") {
    query = query.eq("assignee_id", user.id);
  }

  const { data: tasks } = await query;
  const items = (tasks ?? []) as Task[];

  // Fetch users
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const users = allUsers ?? [];

  // Count
  const { count: totalCount } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("parent_task_id", null);

  // Fetch dependencies for node view
  let dependencies: TaskDependency[] = [];
  if (view === "node") {
    const taskIds = items.map((t) => t.id);
    if (taskIds.length > 0) {
      const { data: depsData } = await supabase
        .from("task_dependencies")
        .select("*")
        .in("task_id", taskIds);
      dependencies = (depsData ?? []) as TaskDependency[];
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.name} — Tasks`}
        description={`프로젝트 Task ${totalCount ?? 0}건`}
      >
        <TaskCreateDialog projectId={projectId} users={users} />
      </PageHeader>

      {/* Filter + View toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TaskFilterTabs currentFilter={filter} />
        <TaskViewToggle currentView={view} />
      </div>

      {/* Content */}
      {items.length > 0 ? (
        <>
          {view === "list" && <TaskList tasks={items} users={users} />}
          {view === "board" && <TaskBoard tasks={items} users={users} />}
          {view === "calendar" && <TaskCalendarView tasks={items} />}
          {view === "gantt" && <TaskGanttView tasks={items} />}
          {view === "node" && (
            <TaskNodeView
              tasks={items}
              dependencies={dependencies}
              projectId={projectId}
              users={users}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Task가 없습니다"
          description={
            filter !== "all"
              ? "해당 필터에 맞는 Task가 없습니다."
              : "새 Task를 생성하여 프로젝트 업무를 관리하세요."
          }
        />
      )}
    </div>
  );
}

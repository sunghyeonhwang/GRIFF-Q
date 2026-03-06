import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskFilterTabs, type TaskFilter } from "@/components/tasks/task-filter-tabs";
import { TaskViewToggle, type TaskViewType } from "@/components/tasks/task-view-toggle";
import { TaskList } from "@/components/tasks/task-list";
import dynamic from "next/dynamic";

const TaskBoard = dynamic(
  () => import("@/components/tasks/task-board").then((m) => m.TaskBoard),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);
import { ClipboardList } from "lucide-react";
import type { Task } from "@/types/task.types";

const VALID_FILTERS: TaskFilter[] = ["all", "today", "upcoming", "completed", "my"];
const VALID_VIEWS: TaskViewType[] = ["list", "board"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const params = await searchParams;

  // Parse params
  const rawFilter = typeof params.filter === "string" ? params.filter : "all";
  const filter: TaskFilter = VALID_FILTERS.includes(rawFilter as TaskFilter)
    ? (rawFilter as TaskFilter)
    : "all";

  const rawView = typeof params.view === "string" ? params.view : "list";
  const view: TaskViewType = VALID_VIEWS.includes(rawView as TaskViewType)
    ? (rawView as TaskViewType)
    : "list";

  // Build query
  let query = supabase
    .from("tasks")
    .select("*, assignee:users!tasks_assignee_id_fkey(name, email)")
    .is("parent_task_id", null)
    .order("sort_order", { ascending: true });

  // Apply filters
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

  // Fetch users for dialogs
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const users = allUsers ?? [];

  // Summary counts — single query instead of 3
  const { data: summaryTasks } = await supabase
    .from("tasks")
    .select("due_date, assignee_id, status")
    .is("parent_task_id", null);
  const allTasks = summaryTasks ?? [];
  const totalCount = allTasks.length;
  const todayCount = allTasks.filter((t) => t.due_date === today).length;
  const myCount = allTasks.filter((t) => t.assignee_id === user.id && t.status !== "completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task 관리"
        description={`전체 ${totalCount}건 · 오늘 ${todayCount}건 · 내 작업 ${myCount}건`}
      >
        <TaskCreateDialog users={users} />
      </PageHeader>

      {/* Filter + View toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TaskFilterTabs currentFilter={filter} />
        <TaskViewToggle currentView={view} />
      </div>

      {/* Content */}
      {items.length > 0 ? (
        view === "list" ? (
          <TaskList tasks={items} users={users} />
        ) : (
          <TaskBoard tasks={items} users={users} />
        )
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Task가 없습니다"
          description={
            filter !== "all"
              ? "해당 필터에 맞는 Task가 없습니다. 필터를 변경해보세요."
              : "새 Task를 생성하여 업무를 관리하세요."
          }
        />
      )}
    </div>
  );
}

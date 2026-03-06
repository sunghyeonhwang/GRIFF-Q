import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderKanban } from "lucide-react";
import {
  parsePaginationParams,
  parseSortParams,
  buildPaginationRange,
} from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
import {
  ProjectViewToggle,
  type ProjectViewType,
} from "@/components/projects/project-view-toggle";
import { ProjectListView } from "@/components/projects/project-list-view";
import dynamic from "next/dynamic";

const ProjectBoardView = dynamic(
  () => import("@/components/projects/project-board-view").then((m) => m.ProjectBoardView),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);
const ProjectCalendarView = dynamic(
  () => import("@/components/projects/project-calendar-view").then((m) => m.ProjectCalendarView),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);
const SORTABLE_COLUMNS = ["created_at", "name", "status", "start_date"];
const VALID_VIEWS: ProjectViewType[] = ["list", "board", "calendar"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const params = await searchParams;

  const { page, pageSize } = parsePaginationParams(params);
  const { sortBy, sortOrder } = parseSortParams(
    params,
    SORTABLE_COLUMNS,
    "created_at",
  );
  const { from, to } = buildPaginationRange(page, pageSize);

  // Parse view param
  const rawView = typeof params.view === "string" ? params.view : "list";
  const view: ProjectViewType = VALID_VIEWS.includes(rawView as ProjectViewType)
    ? (rawView as ProjectViewType)
    : "list";

  // For board/calendar/gantt, fetch all projects (no pagination)
  const needsAllData = view !== "list";

  let query = supabase
    .from("projects")
    .select("*, users!projects_lead_user_id_fkey(name)", { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (!needsAllData) {
    query = query.range(from, to);
  }

  const { data: projects, count } = await query;

  const items = projects ?? [];
  const totalCount = count ?? 0;

  // Summary card counts — single query instead of 3
  const { data: statusCounts } = await supabase
    .from("projects")
    .select("status");
  const activeCount = (statusCounts ?? []).filter((p) => p.status === "active").length;
  const completedCount = (statusCounts ?? []).filter((p) => p.status === "completed").length;
  const onHoldCount = (statusCounts ?? []).filter((p) => p.status === "on_hold").length;

  // Fetch users for the create dialog
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="프로젝트 관리"
        description="프로젝트를 생성하고 관련 데이터를 통합 관리합니다."
      >
        <ProjectCreateDialog userId={user.id} users={allUsers ?? []} />
      </PageHeader>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              보류
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{onHoldCount}건</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects view toggle + views */}
      {totalCount > 0 ? (
        <>
          <div className="flex justify-end">
            <ProjectViewToggle currentView={view} searchParams={params} />
          </div>

          {/* List view */}
          {view === "list" && (
            <ProjectListView
              items={items}
              sortBy={sortBy}
              sortOrder={sortOrder}
              searchParams={params}
            />
          )}

          {/* Board view */}
          {view === "board" && <ProjectBoardView items={items} />}

          {/* Calendar view (통합 캘린더) */}
          {view === "calendar" && <ProjectCalendarView items={items} />}

          {/* Pagination (list view only) */}
          {view === "list" && (
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              searchParams={params}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="등록된 프로젝트가 없습니다"
          description="새 프로젝트를 생성하여 업무를 통합 관리하세요."
        />
      )}
    </div>
  );
}

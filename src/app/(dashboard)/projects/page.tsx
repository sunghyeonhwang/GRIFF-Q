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
import { ProjectBoardView } from "@/components/projects/project-board-view";
import { ProjectCalendarView } from "@/components/projects/project-calendar-view";
import { ProjectGanttView } from "@/components/projects/project-gantt-view";

const SORTABLE_COLUMNS = ["created_at", "name", "status", "start_date"];
const VALID_VIEWS: ProjectViewType[] = ["list", "board", "calendar", "gantt"];

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

  // Summary card counts
  const [activeRes, completedRes, onHoldRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "on_hold"),
  ]);
  const activeCount = activeRes.count ?? 0;
  const completedCount = completedRes.count ?? 0;
  const onHoldCount = onHoldRes.count ?? 0;

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

          {/* Calendar view */}
          {view === "calendar" && <ProjectCalendarView items={items} />}

          {/* Gantt view */}
          {view === "gantt" && <ProjectGanttView items={items} />}

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

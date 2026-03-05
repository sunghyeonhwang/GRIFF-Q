import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderKanban } from "lucide-react";
import { parsePaginationParams, parseSortParams, buildPaginationRange } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataCard } from "@/components/ui/data-card";

const STATUS_LABELS: Record<string, string> = {
  active: "진행 중",
  completed: "완료",
  on_hold: "보류",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  on_hold: "outline",
};

const SORTABLE_COLUMNS = ["created_at", "name", "status", "start_date"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const params = await searchParams;

  const { page, pageSize } = parsePaginationParams(params);
  const { sortBy, sortOrder } = parseSortParams(params, SORTABLE_COLUMNS, "created_at");
  const { from, to } = buildPaginationRange(page, pageSize);
  const view = (typeof params.view === "string" && params.view === "card") ? "card" as const : "table" as const;

  const { data: projects, count } = await supabase
    .from("projects")
    .select("*, users!projects_lead_user_id_fkey(name)", { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  const items = projects ?? [];
  const totalCount = count ?? 0;
  const projectIds = items.map((p) => p.id);

  // Count related items (meetings only)
  const meetingsRes = projectIds.length
    ? await supabase
        .from("meetings")
        .select("project_id")
        .in("project_id", projectIds)
    : { data: [] };

  function countByProject(data: { project_id: string }[] | null) {
    const map = new Map<string, number>();
    for (const item of data ?? []) {
      if (item.project_id) {
        map.set(item.project_id, (map.get(item.project_id) ?? 0) + 1);
      }
    }
    return map;
  }

  const meetingCounts = countByProject(meetingsRes.data);

  // 요약 카드: 전체 데이터 기준 (별도 count 쿼리)
  const [activeRes, completedRes, onHoldRes] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "on_hold"),
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

      {/* Projects view toggle + list */}
      {totalCount > 0 ? (
        <>
          <div className="flex justify-end">
            <ViewToggle currentView={view} searchParams={params} />
          </div>

          {/* 카드 뷰 */}
          <div className={view === "card" ? "block" : "block md:hidden"}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <DataCard key={p.id} href={`/projects/${p.id}`} title={p.name}>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[p.status] ?? "outline"}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{(p as any).users?.name ?? "-"}</span>
                    <span>
                      {p.start_date
                        ? new Date(p.start_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>회의 {meetingCounts.get(p.id) ?? 0}</span>
                  </div>
                </DataCard>
              ))}
            </div>
          </div>

          {/* 테이블 뷰 */}
          <div className={view === "table" ? "hidden md:block" : "hidden"}>
          <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="name" label="프로젝트명" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <SortableTableHead column="status" label="상태" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">담당자</th>
                  <SortableTableHead column="start_date" label="시작일" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">종료일</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-center align-middle font-medium whitespace-nowrap">회의록</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[p.status] ?? "outline"}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(p as any).users?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.start_date
                        ? new Date(p.start_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.end_date
                        ? new Date(p.end_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {meetingCounts.get(p.id) ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </div>

          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} searchParams={params} />
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

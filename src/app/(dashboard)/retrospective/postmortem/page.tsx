import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PostmortemCreateButton } from "@/components/retrospective/postmortem-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle } from "lucide-react";
import { parsePaginationParams, parseSortParams, buildPaginationRange } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";

const SEVERITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const SEVERITY_BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  critical: "destructive",
};

const SORTABLE_COLUMNS = ["created_at", "severity", "incident_date"];

export default async function PostmortemListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const supabase = await createClient();
  const params = await searchParams;

  const { page, pageSize } = parsePaginationParams(params);
  const { sortBy, sortOrder } = parseSortParams(params, SORTABLE_COLUMNS, "created_at");
  const { from, to } = buildPaginationRange(page, pageSize);

  const { data: postmortems, count } = await supabase
    .from("postmortems")
    .select("*, projects(name)", { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  const items = postmortems ?? [];
  const totalCount = count ?? 0;

  // 이미 포스트모템이 있는 프로젝트 제외 (전체 postmortem에서 project_id 수집)
  const { data: allPmProjectIds } = await supabase
    .from("postmortems")
    .select("project_id");
  const existingProjectIds = new Set((allPmProjectIds ?? []).map((pm) => pm.project_id));
  const availableProjects = (projects ?? []).filter(
    (p) => !existingProjectIds.has(p.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="포스트모템"
        description="프로젝트별 장애·이슈 원인 분석과 재발 방지 대책을 기록합니다."
      >
        <PostmortemCreateButton projects={availableProjects} />
      </PageHeader>

      {totalCount > 0 ? (
        <div className="space-y-0">
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">프로젝트</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">제목</th>
                  <SortableTableHead column="severity" label="심각도" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <SortableTableHead column="incident_date" label="발생일" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <SortableTableHead column="created_at" label="작성일" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((pm) => (
                  <TableRow key={pm.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${pm.project_id}/postmortem`}
                        className="hover:underline"
                      >
                        {(pm as any).projects?.name ?? "-"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${pm.project_id}/postmortem`}
                        className="hover:underline"
                      >
                        {pm.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          SEVERITY_BADGE_VARIANTS[pm.severity] ?? "outline"
                        }
                      >
                        {SEVERITY_LABELS[pm.severity] ?? pm.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(pm.incident_date).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(pm.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} searchParams={params} />
        </div>
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title="작성된 포스트모템이 없습니다"
          description="프로젝트별 장애·이슈 원인 분석과 재발 방지 대책을 기록하세요."
        />
      )}
    </div>
  );
}

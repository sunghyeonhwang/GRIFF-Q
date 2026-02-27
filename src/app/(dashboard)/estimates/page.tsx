import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_VARIANTS,
} from "@/lib/estimate-constants";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Calculator } from "lucide-react";
import { parsePaginationParams, parseSortParams, buildPaginationRange } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataCard } from "@/components/ui/data-card";

const SORTABLE_COLUMNS = ["created_at", "project_name", "client_name", "estimate_date", "status"];

export default async function EstimatesPage({
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

  const [{ data: estimates, count }, draftRes, confirmedRes, sentRes] = await Promise.all([
    supabase
      .from("estimates")
      .select("*, users!estimates_created_by_fkey(name)", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(from, to),
    supabase.from("estimates").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("estimates").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("estimates").select("id", { count: "exact", head: true }).eq("status", "sent"),
  ]);

  const items = estimates ?? [];
  const totalCount = count ?? 0;
  const draftCount = draftRes.count ?? 0;
  const confirmedCount = confirmedRes.count ?? 0;
  const sentCount = sentRes.count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="견적서 관리"
        description="프로젝트 견적서를 작성하고 관리합니다."
      >
        <Link href="/estimates/new">
          <Button>
            <Plus className="mr-2 size-4" />
            견적서 생성
          </Button>
        </Link>
      </PageHeader>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              작성중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{draftCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              확정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{confirmedCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              발송완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sentCount}건</p>
          </CardContent>
        </Card>
      </div>

      {/* 뷰 토글 + 견적서 목록 */}
      {totalCount > 0 ? (
        <>
          <div className="flex justify-end">
            <ViewToggle currentView={view} searchParams={params} />
          </div>

          {/* 카드 뷰 (모바일 기본 + 데스크톱 토글) */}
          <div className={view === "card" ? "block" : "block md:hidden"}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => (
                <DataCard key={e.id} href={`/estimates/${e.id}`} title={e.project_name}>
                  <div className="flex items-center gap-2">
                    <Badge variant={ESTIMATE_STATUS_VARIANTS[e.status] ?? "outline"}>
                      {ESTIMATE_STATUS_LABELS[e.status] ?? e.status}
                    </Badge>
                    {e.locked_by && <Badge variant="destructive">편집 중</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{e.client_name}</span>
                    <span>
                      {e.estimate_date
                        ? new Date(e.estimate_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    작성자: {(e as any).users?.name ?? "-"}
                  </p>
                </DataCard>
              ))}
            </div>
          </div>

          {/* 테이블 뷰 (데스크톱 기본 + 토글) */}
          <div className={view === "table" ? "hidden md:block" : "hidden"}>
            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead column="project_name" label="프로젝트명" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                      <SortableTableHead column="client_name" label="클라이언트" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                      <SortableTableHead column="estimate_date" label="견적일" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                      <SortableTableHead column="status" label="상태" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                      <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">편집 잠금</th>
                      <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">작성자</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/estimates/${e.id}`}
                            className="hover:underline"
                          >
                            {e.project_name}
                          </Link>
                        </TableCell>
                        <TableCell>{e.client_name}</TableCell>
                        <TableCell className="text-sm">
                          {e.estimate_date
                            ? new Date(e.estimate_date).toLocaleDateString("ko-KR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ESTIMATE_STATUS_VARIANTS[e.status] ?? "outline"
                            }
                          >
                            {ESTIMATE_STATUS_LABELS[e.status] ?? e.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {e.locked_by ? (
                            <Badge variant="destructive">편집 중</Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(e as any).users?.name ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} searchParams={params} />
        </>
      ) : (
        <EmptyState
          icon={Calculator}
          title="등록된 견적서가 없습니다"
          description="새 견적서를 작성하여 프로젝트 비용을 관리하세요."
        >
          <Link href="/estimates/new">
            <Button>
              <Plus className="mr-2 size-4" />
              견적서 생성
            </Button>
          </Link>
        </EmptyState>
      )}
    </div>
  );
}

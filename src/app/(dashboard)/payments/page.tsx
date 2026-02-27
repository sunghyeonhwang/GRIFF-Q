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
import { Plus, FileSpreadsheet, CreditCard as CreditCardIcon } from "lucide-react";
import { PaymentStatusActions } from "@/components/payments/payment-status-actions";
import { CopyButton } from "@/components/payments/copy-button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { parsePaginationParams, parseSortParams, buildPaginationRange } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataCard } from "@/components/ui/data-card";

const SORTABLE_COLUMNS = ["due_date", "name", "amount"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const params = await searchParams;

  const { page, pageSize } = parsePaginationParams(params);
  const { sortBy, sortOrder } = parseSortParams(params, SORTABLE_COLUMNS, "due_date", "asc");
  const { from, to } = buildPaginationRange(page, pageSize);

  // 요약 카드용 count 쿼리 (전체 데이터)
  const [
    { data: payments, count },
    pendingCountRes,
    completedCountRes,
    pendingAmountRes,
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*, users!payments_created_by_fkey(name)", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(from, to),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("payments").select("amount").eq("status", "pending"),
  ]);

  const items = payments ?? [];
  const totalCount = count ?? 0;
  const pendingCount = pendingCountRes.count ?? 0;
  const completedCount = completedCountRes.count ?? 0;
  const totalAmount = (pendingAmountRes.data ?? []).reduce(
    (sum, p) => sum + Number(p.amount), 0
  );

  const view = (typeof params.view === "string" && params.view === "card") ? "card" as const : "table" as const;
  const pendingItems = items.filter((p) => p.status === "pending");
  const completedItems = items.filter((p) => p.status === "completed");

  return (
    <div className="space-y-6">
      <PageHeader
        title="결제"
        description="결제해야 할 항목을 관리합니다. 계좌번호와 금액을 복사할 수 있습니다."
      >
        <a href="/api/payments/export" target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 size-4" />
            Excel
          </Button>
        </a>
        <Link href="/payments/new">
          <Button>
            <Plus className="mr-2 size-4" />
            결제 등록
          </Button>
        </Link>
      </PageHeader>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              대기 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              대기 총액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalAmount.toLocaleString()}원
            </p>
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
      </div>

      {totalCount > 0 && (
        <div className="flex justify-end">
          <ViewToggle currentView={view} searchParams={params} />
        </div>
      )}

      {/* 카드 뷰 */}
      {totalCount > 0 && (
        <div className={view === "card" ? "block" : "block md:hidden"}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <DataCard key={p.id} href={`/payments/${p.id}`} title={p.name}>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "completed" ? "default" : "outline"}>
                    {p.status === "completed" ? "완료" : "대기"}
                  </Badge>
                  <Badge variant="outline">{p.bank}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{Number(p.amount).toLocaleString()}원</span>
                  <span className="text-muted-foreground">
                    {p.due_date ? new Date(p.due_date).toLocaleDateString("ko-KR") : "-"}
                  </span>
                </div>
              </DataCard>
            ))}
          </div>
        </div>
      )}

      {/* 테이블 뷰 */}
      <div className={view === "table" ? "hidden md:block space-y-6" : "hidden"}>

      {/* 대기 중 결제 목록 */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">결제 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="name" label="품목" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">은행</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">계좌번호</th>
                  <SortableTableHead column="amount" label="금액" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <SortableTableHead column="due_date" label="마감일" currentSort={sortBy} currentOrder={sortOrder} searchParams={params} />
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/payments/${p.id}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.bank}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm">
                          {p.account_number}
                        </span>
                        <CopyButton value={p.account_number} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {Number(p.amount).toLocaleString()}원
                        </span>
                        <CopyButton value={String(p.amount)} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {p.due_date
                        ? new Date(p.due_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusActions
                        paymentId={p.id}
                        userId={user.id}
                        paymentName={p.name}
                        paymentAmount={Number(p.amount)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 완료 목록 */}
      {completedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">
              완료된 결제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">품목</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">은행</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">계좌번호</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">금액</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">마감일</th>
                  <th data-slot="table-head" className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">상태</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedItems.map((p) => (
                  <TableRow key={p.id} className="opacity-60">
                    <TableCell className="font-medium">
                      <Link
                        href={`/payments/${p.id}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.bank}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {p.account_number}
                    </TableCell>
                    <TableCell>
                      {Number(p.amount).toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {p.due_date
                        ? new Date(p.due_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">완료</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      </div>{/* end table view wrapper */}

      {totalCount > 0 && (
        <Pagination page={page} pageSize={pageSize} totalCount={totalCount} searchParams={params} />
      )}

      {totalCount === 0 && (
        <EmptyState
          icon={CreditCardIcon}
          title="등록된 결제 항목이 없습니다"
          description="새 결제를 등록하여 입금 관리를 시작하세요."
        >
          <Link href="/payments/new">
            <Button>
              <Plus className="mr-2 size-4" />
              결제 등록
            </Button>
          </Link>
        </EmptyState>
      )}
    </div>
  );
}

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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileSpreadsheet, CreditCard as CreditCardIcon } from "lucide-react";
import { PaymentStatusActions } from "@/components/payments/payment-status-actions";
import { CopyButton } from "@/components/payments/copy-button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PaymentsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("*, users!payments_created_by_fkey(name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  const items = payments ?? [];

  const pendingItems = items.filter((p) => p.status === "pending");
  const completedItems = items.filter((p) => p.status === "completed");
  const totalAmount = pendingItems.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

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
            <p className="text-2xl font-bold">{pendingItems.length}건</p>
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
            <p className="text-2xl font-bold">{completedItems.length}건</p>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead>품목</TableHead>
                  <TableHead>은행</TableHead>
                  <TableHead>계좌번호</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead></TableHead>
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
                  <TableHead>품목</TableHead>
                  <TableHead>은행</TableHead>
                  <TableHead>계좌번호</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead>상태</TableHead>
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

      {items.length === 0 && (
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

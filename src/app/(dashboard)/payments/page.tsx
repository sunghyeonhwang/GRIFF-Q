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
import { Plus, FileSpreadsheet } from "lucide-react";
import { PaymentStatusActions } from "@/components/payments/payment-status-actions";

export default async function PaymentsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("*, users!payments_created_by_fkey(name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  const items = payments ?? [];

  // 은행별 그룹핑
  const bankGroups = new Map<string, typeof items>();
  for (const p of items) {
    if (!bankGroups.has(p.bank)) bankGroups.set(p.bank, []);
    bankGroups.get(p.bank)!.push(p);
  }

  const pendingCount = items.filter((p) => p.status === "pending").length;
  const completedCount = items.filter((p) => p.status === "completed").length;
  const totalAmount = items
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">입금/결제 요청</h1>
          <p className="text-muted-foreground">
            결제 요청을 등록하고 입금 상태를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/payments/export" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 size-4" />
              Excel 내보내기
            </Button>
          </a>
          <Link href="/payments/new">
            <Button>
              <Plus className="mr-2 size-4" />
              요청 등록
            </Button>
          </Link>
        </div>
      </div>

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

      {/* 은행별 그룹 뷰 */}
      {bankGroups.size > 0 ? (
        Array.from(bankGroups.entries()).map(([bank, bankItems]) => (
          <Card key={bank}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{bank}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>계좌번호</TableHead>
                    <TableHead>마감일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankItems.map((p) => (
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
                        {Number(p.amount).toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-sm">{p.account_number}</TableCell>
                      <TableCell className="text-sm">
                        {p.due_date
                          ? new Date(p.due_date).toLocaleDateString("ko-KR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "completed" ? "default" : "outline"
                          }
                        >
                          {p.status === "completed" ? "완료" : "대기"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.status === "pending" && (
                          <PaymentStatusActions paymentId={p.id} userId={user.id} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            아직 등록된 요청이 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

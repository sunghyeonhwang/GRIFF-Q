import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";
import { PaymentStatusActions } from "@/components/payments/payment-status-actions";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*, users!payments_created_by_fkey(name)")
    .eq("id", id)
    .single();

  if (!payment) notFound();

  const canEdit =
    payment.status !== "completed" ||
    user.role === "super" ||
    user.role === "boss";

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/payments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{payment.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              등록자: {(payment as any).users?.name ?? "-"} ·{" "}
              {new Date(payment.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {payment.status === "pending" && (
            <PaymentStatusActions paymentId={payment.id} userId={user.id} />
          )}
          {canEdit && (
            <Link href={`/payments/${id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 size-4" />
                수정
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 상태 */}
      <div>
        <Badge
          variant={payment.status === "completed" ? "default" : "outline"}
          className="text-sm"
        >
          {payment.status === "completed" ? "입금 완료" : "대기 중"}
        </Badge>
      </div>

      {/* 결제 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">금액</dt>
              <dd className="font-semibold text-lg mt-1">
                {Number(payment.amount).toLocaleString()}원
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">은행</dt>
              <dd className="font-medium mt-1">{payment.bank}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">계좌번호</dt>
              <dd className="font-medium mt-1">{payment.account_number}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">입금자명</dt>
              <dd className="font-medium mt-1">{payment.depositor_name || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">마감일</dt>
              <dd className="font-medium mt-1">
                {payment.due_date
                  ? new Date(payment.due_date).toLocaleDateString("ko-KR")
                  : "-"}
              </dd>
            </div>
            {payment.completed_at && (
              <div>
                <dt className="text-muted-foreground">완료일</dt>
                <dd className="font-medium mt-1">
                  {new Date(payment.completed_at).toLocaleDateString("ko-KR")}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 비고 */}
      {payment.note && (
        <Card>
          <CardHeader>
            <CardTitle>비고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{payment.note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

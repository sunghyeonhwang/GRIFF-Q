import Link from "next/link";
import { notFound } from "next/navigation";
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
import { ArrowLeft, Pencil, GitCompareArrows, Download, FileSpreadsheet } from "lucide-react";
import { SheetsExportButton } from "@/components/estimates/sheets-export-button";
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_VARIANTS,
  VAT_RATE,
} from "@/lib/estimate-constants";

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "border-l-4 border-l-yellow-400",
  green: "border-l-4 border-l-green-500",
  blue: "border-l-4 border-l-blue-500",
  red: "border-l-4 border-l-red-500",
  purple: "border-l-4 border-l-purple-500",
};

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, users!estimates_created_by_fkey(name)")
    .eq("id", id)
    .single();

  if (!estimate) notFound();

  const { data: estimateItems } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  const items = estimateItems ?? [];

  const canEdit =
    estimate.status !== "sent" ||
    user.role === "super" ||
    user.role === "boss";

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/estimates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{estimate.project_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              등록자: {(estimate as any).users?.name ?? "-"} ·{" "}
              {new Date(estimate.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/estimates/${id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Download className="mr-2 size-4" />
              PDF
            </Button>
          </a>
          <a href={`/api/estimates/${id}/excel`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 size-4" />
              Excel
            </Button>
          </a>
          <SheetsExportButton estimateId={id} />
          <Link href={`/estimates/${id}/compare`}>
            <Button variant="outline">
              <GitCompareArrows className="mr-2 size-4" />
              견적 비교
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/estimates/${id}/edit`}>
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
          variant={ESTIMATE_STATUS_VARIANTS[estimate.status] ?? "outline"}
          className="text-sm"
        >
          {ESTIMATE_STATUS_LABELS[estimate.status] ?? estimate.status}
        </Badge>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>견적 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">프로젝트명</dt>
              <dd className="font-semibold text-lg mt-1">
                {estimate.project_name}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">클라이언트</dt>
              <dd className="font-medium mt-1">{estimate.client_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">견적일</dt>
              <dd className="font-medium mt-1">
                {estimate.estimate_date
                  ? new Date(estimate.estimate_date).toLocaleDateString("ko-KR")
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">유효기한</dt>
              <dd className="font-medium mt-1">
                {estimate.valid_until
                  ? new Date(estimate.valid_until).toLocaleDateString("ko-KR")
                  : "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 견적 항목 */}
      <Card>
        <CardHeader>
          <CardTitle>견적 항목</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>항목명</TableHead>
                <TableHead>규격/설명</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>단위</TableHead>
                <TableHead className="text-right">단가</TableHead>
                <TableHead className="text-right">금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const amount =
                  Number(item.quantity) * Number(item.unit_price);
                const highlightClass = item.highlight
                  ? HIGHLIGHT_COLORS[item.highlight] ?? ""
                  : "";

                return (
                  <TableRow key={item.id} className={highlightClass}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.item_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.specification || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity).toLocaleString()}
                    </TableCell>
                    <TableCell>{item.unit || "-"}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.unit_price).toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {amount.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-6"
                  >
                    등록된 항목이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* 합계 */}
          {items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <dl className="space-y-2 text-sm w-64">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">소계</dt>
                  <dd className="font-medium">
                    {subtotal.toLocaleString()}원
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    부가세 ({(VAT_RATE * 100).toFixed(0)}%)
                  </dt>
                  <dd className="font-medium">{vat.toLocaleString()}원</dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt className="font-semibold">합계</dt>
                  <dd className="font-bold text-lg">
                    {total.toLocaleString()}원
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 비고 */}
      {estimate.note && (
        <Card>
          <CardHeader>
            <CardTitle>비고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{estimate.note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
import { ArrowLeft } from "lucide-react";
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_VARIANTS,
  VAT_RATE,
} from "@/lib/estimate-constants";

interface EstimateItem {
  id: string;
  item_name: string;
  specification: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  sort_order: number;
  highlight: string | null;
}

function ItemsTable({
  items,
  compareItems,
  direction,
}: {
  items: EstimateItem[];
  compareItems: EstimateItem[] | null;
  direction: "current" | "previous";
}) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  // Build a map of compare items by item_name for price diff
  const compareMap = new Map<string, number>();
  if (compareItems) {
    for (const ci of compareItems) {
      compareMap.set(ci.item_name, Number(ci.unit_price));
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>항목명</TableHead>
            <TableHead className="text-right">수량</TableHead>
            <TableHead className="text-right">단가</TableHead>
            <TableHead className="text-right">금액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const amount = Number(item.quantity) * Number(item.unit_price);
            const currentPrice = Number(item.unit_price);
            const otherPrice = compareMap.get(item.item_name);

            let priceClass = "";
            if (compareItems && otherPrice !== undefined) {
              if (direction === "current" && currentPrice > otherPrice) {
                priceClass = "text-red-600";
              } else if (direction === "current" && currentPrice < otherPrice) {
                priceClass = "text-green-600";
              } else if (direction === "previous" && currentPrice > otherPrice) {
                // previous is higher
                priceClass = "text-red-600";
              } else if (direction === "previous" && currentPrice < otherPrice) {
                priceClass = "text-green-600";
              }
            }
            // For "previous" direction, compare with current items
            // Re-derive: if this item's price differs from the other side
            let diffClass = "";
            if (compareItems && otherPrice !== undefined && currentPrice !== otherPrice) {
              if (currentPrice > otherPrice) {
                diffClass = "text-red-600 font-semibold";
              } else {
                diffClass = "text-green-600 font-semibold";
              }
            }

            return (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {item.item_name}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {Number(item.quantity).toLocaleString()}
                </TableCell>
                <TableCell className={`text-right text-sm ${diffClass}`}>
                  {currentPrice.toLocaleString()}원
                </TableCell>
                <TableCell className={`text-right text-sm font-medium ${diffClass}`}>
                  {amount.toLocaleString()}원
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-6"
              >
                항목 없음
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <dl className="space-y-1 text-sm w-52">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">소계</dt>
              <dd className="font-medium">{subtotal.toLocaleString()}원</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                부가세 ({(VAT_RATE * 100).toFixed(0)}%)
              </dt>
              <dd className="font-medium">{vat.toLocaleString()}원</dd>
            </div>
            <div className="flex justify-between border-t pt-1">
              <dt className="font-semibold">합계</dt>
              <dd className="font-bold">{total.toLocaleString()}원</dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
}

export default async function EstimateComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  // 현재 견적서 조회
  const { data: currentEstimate } = await supabase
    .from("estimates")
    .select("*, users!estimates_created_by_fkey(name)")
    .eq("id", id)
    .single();

  if (!currentEstimate) notFound();

  const { data: currentItems } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  // 같은 프로젝트의 이전 견적서 조회
  const { data: previousEstimates } = await supabase
    .from("estimates")
    .select("*")
    .eq("project_name", currentEstimate.project_name)
    .neq("id", id)
    .order("estimate_date", { ascending: false });

  // 현재 견적 이전 날짜 중 가장 최근 것 선택
  const previousEstimate =
    previousEstimates?.find(
      (e) =>
        new Date(e.estimate_date) < new Date(currentEstimate.estimate_date)
    ) ?? previousEstimates?.[0] ?? null;

  let previousItems: EstimateItem[] | null = null;

  if (previousEstimate) {
    const { data } = await supabase
      .from("estimate_items")
      .select("*")
      .eq("estimate_id", previousEstimate.id)
      .order("sort_order");
    previousItems = data ?? [];
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href={`/estimates/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">견적 비교</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentEstimate.project_name} - 견적서 비교
          </p>
        </div>
      </div>

      {previousEstimate ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 이전 견적 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">이전 견적</CardTitle>
                <Badge
                  variant={
                    ESTIMATE_STATUS_VARIANTS[previousEstimate.status] ??
                    "outline"
                  }
                >
                  {ESTIMATE_STATUS_LABELS[previousEstimate.status] ??
                    previousEstimate.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {previousEstimate.estimate_date
                  ? new Date(
                      previousEstimate.estimate_date
                    ).toLocaleDateString("ko-KR")
                  : "-"}
              </p>
            </CardHeader>
            <CardContent>
              <ItemsTable
                items={previousItems ?? []}
                compareItems={currentItems ?? []}
                direction="previous"
              />
            </CardContent>
          </Card>

          {/* 현재 견적 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">현재 견적</CardTitle>
                <Badge
                  variant={
                    ESTIMATE_STATUS_VARIANTS[currentEstimate.status] ??
                    "outline"
                  }
                >
                  {ESTIMATE_STATUS_LABELS[currentEstimate.status] ??
                    currentEstimate.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentEstimate.estimate_date
                  ? new Date(
                      currentEstimate.estimate_date
                    ).toLocaleDateString("ko-KR")
                  : "-"}
              </p>
            </CardHeader>
            <CardContent>
              <ItemsTable
                items={currentItems ?? []}
                compareItems={previousItems}
                direction="current"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            비교할 이전 견적이 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

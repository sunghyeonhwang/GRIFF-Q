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
import { Plus } from "lucide-react";
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_VARIANTS,
} from "@/lib/estimate-constants";

export default async function EstimatesPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: estimates } = await supabase
    .from("estimates")
    .select("*, users!estimates_created_by_fkey(name)")
    .order("created_at", { ascending: false });

  const items = estimates ?? [];

  const draftCount = items.filter((e) => e.status === "draft").length;
  const confirmedCount = items.filter((e) => e.status === "confirmed").length;
  const sentCount = items.filter((e) => e.status === "sent").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">견적서 관리</h1>
          <p className="text-muted-foreground">
            프로젝트 견적서를 작성하고 관리합니다.
          </p>
        </div>
        <Link href="/estimates/new">
          <Button>
            <Plus className="mr-2 size-4" />
            견적서 생성
          </Button>
        </Link>
      </div>

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

      {/* 견적서 테이블 */}
      {items.length > 0 ? (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트명</TableHead>
                  <TableHead>클라이언트</TableHead>
                  <TableHead>견적일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>편집 잠금</TableHead>
                  <TableHead>작성자</TableHead>
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
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            아직 등록된 견적서가 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

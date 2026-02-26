import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RealtimeEstimateEditor } from "@/components/estimates/realtime-estimate-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import {
  LOCK_TIMEOUT_MINUTES,
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_VARIANTS,
} from "@/lib/estimate-constants";

export default async function EditEstimatePage({
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

  const canEdit =
    estimate.status !== "sent" ||
    user.role === "super" ||
    user.role === "boss";

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/estimates/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">견적서 수정</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            수정 권한이 없습니다. 발송완료 상태의 견적서는 관리자만 수정할 수 있습니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/estimates/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">견적서 실시간 편집</h1>
          <p className="text-sm text-muted-foreground mt-1">
            변경사항이 자동 저장됩니다.
          </p>
        </div>
      </div>

      {/* Estimate basic info (read-only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>견적 정보</CardTitle>
            <Badge
              variant={
                ESTIMATE_STATUS_VARIANTS[estimate.status] ?? "outline"
              }
            >
              {ESTIMATE_STATUS_LABELS[estimate.status] ?? estimate.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">프로젝트명</dt>
              <dd className="font-semibold mt-1">{estimate.project_name}</dd>
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
              <dt className="text-muted-foreground">작성자</dt>
              <dd className="font-medium mt-1">
                {(estimate as any).users?.name ?? "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Realtime editor */}
      <Card>
        <CardHeader>
          <CardTitle>견적 항목</CardTitle>
        </CardHeader>
        <CardContent>
          <RealtimeEstimateEditor
            estimateId={id}
            initialItems={estimateItems ?? []}
            userId={user.id}
            userName={user.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MessageSquare, Users } from "lucide-react";
import { VAT_RATE } from "@/lib/estimate-constants";

const STATUS_LABELS: Record<string, string> = {
  active: "진행 중",
  completed: "완료",
  on_hold: "보류",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  on_hold: "outline",
};

export default async function ProjectReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, users!projects_lead_user_id_fkey(name)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const [meetingsRes, estimatesRes, paymentsRes, retrospectivesRes] =
    await Promise.all([
      supabase
        .from("meetings")
        .select("*")
        .eq("project_id", id)
        .order("meeting_date", { ascending: true }),
      supabase.from("estimates").select("*").eq("project_id", id),
      supabase.from("payments").select("*").eq("project_id", id),
      supabase.from("retrospectives").select("*").eq("project_id", id),
    ]);

  const meetings = meetingsRes.data ?? [];
  const estimates = estimatesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const retrospectives = retrospectivesRes.data ?? [];

  // Calculate estimate totals
  const estimateIds = estimates.map((e) => e.id);
  const { data: estimateItems } = estimateIds.length
    ? await supabase
        .from("estimate_items")
        .select("estimate_id, quantity, unit_price")
        .in("estimate_id", estimateIds)
    : { data: [] };

  let estimateSubtotal = 0;
  for (const item of estimateItems ?? []) {
    estimateSubtotal += Number(item.quantity) * Number(item.unit_price);
  }
  const estimateTotal = estimateSubtotal + Math.round(estimateSubtotal * VAT_RATE);

  // Payment totals
  const paymentTotal = payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const completedPaymentTotal = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">프로젝트 리뷰</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project.name}
          </p>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">프로젝트명</dt>
              <dd className="font-semibold text-lg mt-1">{project.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">상태</dt>
              <dd className="mt-1">
                <Badge
                  variant={STATUS_VARIANTS[project.status] ?? "outline"}
                >
                  {STATUS_LABELS[project.status] ?? project.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">담당자</dt>
              <dd className="font-medium mt-1">
                {(project as any).users?.name ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">기간</dt>
              <dd className="font-medium mt-1">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString("ko-KR")
                  : "-"}{" "}
                ~{" "}
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString("ko-KR")
                  : "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length > 0 ? (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {meetings.map((m) => (
                  <div key={m.id} className="relative pl-8">
                    <div className="absolute left-1.5 top-1.5 size-3 rounded-full bg-blue-500 ring-4 ring-background" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                      </p>
                      <Link
                        href={`/meetings/${m.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {m.title}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              등록된 회의록이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            팀 피드백
          </CardTitle>
        </CardHeader>
        <CardContent>
          {retrospectives.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {retrospectives.length}건의 회고가 등록되어 있습니다.
              </p>
              <Link
                href={`/retrospective/summary/${id}`}
                className="inline-block"
              >
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 size-4" />
                  회고 인사이트 보기
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              등록된 회고가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Estimate vs Actual */}
      <Card>
        <CardHeader>
          <CardTitle>견적 vs 실제</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">견적 총액</p>
              <p className="text-2xl font-bold">
                {estimateTotal.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground">
                {estimates.length}건의 견적서 기준 (VAT 포함)
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">입금 총액</p>
              <p className="text-2xl font-bold">
                {paymentTotal.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground">
                완료: {completedPaymentTotal.toLocaleString()}원 /{" "}
                {payments.length}건
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">차이</p>
              <p
                className={`text-2xl font-bold ${
                  estimateTotal - paymentTotal > 0
                    ? "text-orange-500"
                    : estimateTotal - paymentTotal < 0
                      ? "text-green-500"
                      : ""
                }`}
              >
                {estimateTotal - paymentTotal > 0 ? "+" : ""}
                {(estimateTotal - paymentTotal).toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground">
                {estimateTotal - paymentTotal > 0
                  ? "미수금 있음"
                  : estimateTotal - paymentTotal < 0
                    ? "초과 입금"
                    : "일치"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  Lightbulb,
  Target,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { ProjectReview, RiskLevel, ReviewRecommendation } from "@/types/review.types";

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "심각",
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

const RISK_BG_COLORS: Record<RiskLevel, string> = {
  low: "bg-green-100 dark:bg-green-900/30",
  medium: "bg-yellow-100 dark:bg-yellow-900/30",
  high: "bg-orange-100 dark:bg-orange-900/30",
  critical: "bg-red-100 dark:bg-red-900/30",
};

const RISK_ICONS: Record<RiskLevel, React.ElementType> = {
  low: Shield,
  medium: ShieldAlert,
  high: ShieldX,
  critical: ShieldOff,
};

const RECOMMENDATION_ICONS: Record<string, React.ElementType> = {
  resource: Users,
  schedule: Calendar,
  scope: Target,
  risk: AlertCircle,
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  high: "border-red-200 bg-red-50/50 dark:border-red-800/30 dark:bg-red-950/10",
  medium: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800/30 dark:bg-yellow-950/10",
  low: "border-green-200 bg-green-50/50 dark:border-green-800/30 dark:bg-green-950/10",
};

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444"];

interface ReviewReportDetailProps {
  review: ProjectReview;
  projectId: string;
  projectName: string;
}

export function ReviewReportDetail({
  review,
  projectId,
  projectName,
}: ReviewReportDetailProps) {
  const report = review.report_content;
  const RiskIcon = RISK_ICONS[review.risk_level];

  const pieData = [
    { name: "완료", value: report.progress_overview.completed },
    { name: "진행중", value: report.progress_overview.in_progress },
    { name: "지연", value: report.progress_overview.delayed },
    {
      name: "대기",
      value: Math.max(
        0,
        report.progress_overview.total_tasks -
          report.progress_overview.completed -
          report.progress_overview.in_progress -
          report.progress_overview.delayed
      ),
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}/review`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">AI 보고서 상세</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectName} &middot;{" "}
              {review.review_type === "weekly"
                ? "주간"
                : review.review_type === "monthly"
                  ? "월간"
                  : "수시"}{" "}
              보고서
            </p>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            RISK_BG_COLORS[review.risk_level],
            RISK_COLORS[review.risk_level]
          )}
        >
          <RiskIcon className="size-4" />
          위험도: {RISK_LABELS[review.risk_level]}
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{report.executive_summary}</p>
        </CardContent>
      </Card>

      {/* Progress Overview with Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">진행률 개요</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{report.progress_overview.total_tasks}</p>
                <p className="text-xs text-muted-foreground mt-1">전체 Task</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-3xl font-bold text-green-600">{report.progress_overview.completed}</p>
                <p className="text-xs text-muted-foreground mt-1">완료</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-3xl font-bold text-blue-600">{report.progress_overview.in_progress}</p>
                <p className="text-xs text-muted-foreground mt-1">진행중</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <p className="text-3xl font-bold text-orange-600">{report.progress_overview.delayed}</p>
                <p className="text-xs text-muted-foreground mt-1">지연</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-4xl font-bold">
                {report.progress_overview.completion_rate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">완료율</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">상태 분포</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8">
                데이터 없음
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed + In Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              이번 기간 완료 항목
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.completed_this_period.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {report.completed_this_period.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 text-green-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">완료 항목 없음</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-blue-600" />
              진행중 항목
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.in_progress_items.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {report.in_progress_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Clock className="size-3.5 text-blue-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">진행중 항목 없음</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delayed Items */}
      {report.delayed_items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-orange-600" />
              지연 항목 ({report.delayed_items.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.delayed_items.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-orange-200 dark:border-orange-800/30 bg-orange-50/50 dark:bg-orange-950/10"
                >
                  <p className="font-medium text-sm">{item.title}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">사유:</span>{" "}
                      {item.reason}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">영향:</span>{" "}
                      {item.impact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risks */}
      {report.risks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="size-4" />
              리스크 분석 ({report.risks.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.risks.map((risk, i) => {
                const riskLevel = risk.level as RiskLevel;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-xs",
                        riskLevel === "critical" && "border-red-500 text-red-600",
                        riskLevel === "high" && "border-orange-500 text-orange-600",
                        riskLevel === "medium" && "border-yellow-500 text-yellow-600",
                        riskLevel === "low" && "border-green-500 text-green-600"
                      )}
                    >
                      {RISK_LABELS[riskLevel] ?? risk.level}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm">{risk.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">대응:</span>{" "}
                        {risk.mitigation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {review.recommendations && review.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="size-4 text-yellow-500" />
              AI 추천 ({review.recommendations.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {review.recommendations.map((rec: ReviewRecommendation, i: number) => {
                const IconComp = RECOMMENDATION_ICONS[rec.type] ?? Lightbulb;
                const colorClass = RECOMMENDATION_COLORS[rec.priority] ?? RECOMMENDATION_COLORS.low;

                return (
                  <div
                    key={i}
                    className={cn("p-3 rounded-lg border", colorClass)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComp className="size-4" />
                      <p className="text-sm font-medium">{rec.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {rec.description}
                    </p>
                    <div className="mt-2 ml-6">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          rec.priority === "high" && "text-red-600",
                          rec.priority === "medium" && "text-yellow-600",
                          rec.priority === "low" && "text-green-600"
                        )}
                      >
                        {rec.priority === "high" ? "높음" : rec.priority === "medium" ? "보통" : "낮음"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Period Plan */}
      {report.next_period_plan.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4" />
              향후 계획
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {report.next_period_plan.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-medium mt-0.5">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <p className="text-xs text-muted-foreground text-right">
        생성일: {new Date(review.created_at).toLocaleString("ko-KR")} | 생성자:{" "}
        {review.generated_by}
      </p>
    </div>
  );
}

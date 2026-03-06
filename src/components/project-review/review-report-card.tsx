"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { ProjectReview, RiskLevel } from "@/types/review.types";

const RISK_ICONS: Record<RiskLevel, React.ElementType> = {
  low: Shield,
  medium: ShieldAlert,
  high: ShieldX,
  critical: ShieldOff,
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "text-green-600 bg-green-50 dark:bg-green-950/30",
  medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30",
  high: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  critical: "text-red-600 bg-red-50 dark:bg-red-950/30",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "심각",
};

interface ReviewReportCardProps {
  review: ProjectReview;
}

export function ReviewReportCard({ review }: ReviewReportCardProps) {
  const report = review.report_content;
  const RiskIcon = RISK_ICONS[review.risk_level];

  return (
    <div className="space-y-4">
      {/* Risk Level + Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">프로젝트 현황 요약</CardTitle>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                RISK_COLORS[review.risk_level]
              )}
            >
              <RiskIcon className="size-3.5" />
              위험도: {RISK_LABELS[review.risk_level]}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{report.executive_summary}</p>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">진행률 개요</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{report.progress_overview.total_tasks}</p>
              <p className="text-xs text-muted-foreground">전체</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{report.progress_overview.completed}</p>
              <p className="text-xs text-muted-foreground">완료</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{report.progress_overview.in_progress}</p>
              <p className="text-xs text-muted-foreground">진행중</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{report.progress_overview.delayed}</p>
              <p className="text-xs text-muted-foreground">지연</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{report.progress_overview.completion_rate}%</p>
              <p className="text-xs text-muted-foreground">완료율</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed + In Progress */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              완료 항목
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.completed_this_period.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {report.completed_this_period.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">-</span>
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
                    <span className="text-blue-600 mt-0.5">-</span>
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
              지연 항목
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
                  <p className="text-xs text-muted-foreground mt-1">
                    사유: {item.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    영향: {item.impact}
                  </p>
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
            <CardTitle className="text-base">리스크 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs",
                      risk.level === "critical" && "border-red-500 text-red-600",
                      risk.level === "high" && "border-orange-500 text-orange-600",
                      risk.level === "medium" && "border-yellow-500 text-yellow-600",
                      risk.level === "low" && "border-green-500 text-green-600"
                    )}
                  >
                    {RISK_LABELS[risk.level as RiskLevel] ?? risk.level}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm">{risk.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      대응: {risk.mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Period Plan */}
      {report.next_period_plan.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">향후 계획</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {report.next_period_plan.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-right">
        생성: {new Date(review.created_at).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}

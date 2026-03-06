"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sunrise } from "lucide-react";
import Link from "next/link";

interface DashboardScrumWidgetProps {
  scrumStatus: string | null;
  itemCount: number;
}

const STEP_LABELS: Record<string, string> = {
  brainstorming: "브레인스토밍",
  prioritizing: "우선순위",
  scheduling: "일정 배분",
};

export function DashboardScrumWidget({ scrumStatus, itemCount }: DashboardScrumWidgetProps) {
  const isInProgress =
    scrumStatus === "brainstorming" ||
    scrumStatus === "prioritizing" ||
    scrumStatus === "scheduling";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-card-title">데일리 스크럼</CardTitle>
        <Sunrise className="size-4 text-brand" />
      </CardHeader>
      <CardContent className="space-y-3">
        {(!scrumStatus || scrumStatus === "not_started") && (
          <>
            <p className="text-sm text-muted-foreground">오늘 스크럼을 시작하세요</p>
            <Link href="/scrum">
              <Button size="sm" className="w-full">
                시작하기
              </Button>
            </Link>
          </>
        )}

        {isInProgress && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">진행 중</Badge>
              <Badge variant="outline">{STEP_LABELS[scrumStatus] ?? scrumStatus}</Badge>
            </div>
            <Link href="/scrum">
              <Button size="sm" variant="outline" className="w-full">
                이어하기
              </Button>
            </Link>
          </>
        )}

        {scrumStatus === "completed" && (
          <>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white hover:bg-green-600">완료</Badge>
              <Badge variant="outline">{itemCount}건 계획</Badge>
            </div>
            <Link href="/scrum" className="text-sm text-brand hover:underline">
              확인하기
            </Link>
          </>
        )}

        {scrumStatus === "skipped" && (
          <p className="text-sm text-muted-foreground">오늘 스크럼 건너뜀</p>
        )}
      </CardContent>
    </Card>
  );
}

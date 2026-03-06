import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, SkipForward } from "lucide-react";
import Link from "next/link";
import { PRIORITY_CONFIG } from "@/types/scrum.types";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function ScrumDetailPage({ params }: PageProps) {
  const { date } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: scrum } = await supabase
    .from("daily_scrums")
    .select("*, scrum_items(*)")
    .eq("user_id", user.id)
    .eq("scrum_date", date)
    .single();

  if (!scrum) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/scrum/history">
            <ArrowLeft className="h-4 w-4 mr-1" />
            이력으로 돌아가기
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            해당 날짜의 스크럼 기록이 없습니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = (scrum.scrum_items ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );
  const completedCount = items.filter(
    (i: { status: string }) => i.status === "completed"
  ).length;

  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild>
        <Link href="/scrum/history">
          <ArrowLeft className="h-4 w-4 mr-1" />
          이력으로 돌아가기
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{date} 스크럼</h1>
        <div className="flex items-center gap-2 mt-1">
          {scrum.status === "completed" && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              완료 ({completedCount}/{items.length})
            </Badge>
          )}
          {scrum.status === "skipped" && (
            <Badge variant="outline" className="gap-1">
              <SkipForward className="h-3 w-3" />
              건너뜀: {scrum.skip_reason}
            </Badge>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">계획 항목</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item: {
              id: string;
              title: string;
              priority: keyof typeof PRIORITY_CONFIG;
              status: string;
              time_block_start: string | null;
              time_block_end: string | null;
              estimated_minutes: number;
              is_carried_over: boolean;
            }, idx: number) => {
              const config = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.normal;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <span className="text-sm font-medium text-muted-foreground w-5">
                    {idx + 1}.
                  </span>
                  <span className={cn("text-xs", config.color)}>&#9679;</span>
                  <span className="text-sm flex-1 truncate">{item.title}</span>
                  {item.time_block_start && (
                    <span className="text-xs text-muted-foreground">
                      {item.time_block_start}~{item.time_block_end}
                    </span>
                  )}
                  {item.status === "completed" && (
                    <Badge variant="default" className="text-xs">완료</Badge>
                  )}
                  {item.status === "skipped" && (
                    <Badge variant="outline" className="text-xs">미완료</Badge>
                  )}
                  {item.is_carried_over && (
                    <Badge variant="secondary" className="text-xs">이월</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

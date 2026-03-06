"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Target, History, Moon, Pencil } from "lucide-react";
import type { ScrumItem } from "@/types/scrum.types";
import { PRIORITY_CONFIG } from "@/types/scrum.types";
import { cn } from "@/lib/utils";

interface ScrumSummaryProps {
  scrumId: string;
  items: ScrumItem[];
  onReview: () => void;
  onEdit: () => void;
}

export function ScrumSummary({ scrumId, items, onReview, onEdit }: ScrumSummaryProps) {
  const totalMinutes = items.reduce((sum, i) => sum + i.estimated_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainMinutes = totalMinutes % 60;
  const availableMinutes = 9 * 60 - 60; // 9h work - 1h lunch
  const utilization = Math.round((totalMinutes / availableMinutes) * 100);

  return (
    <Card>
      <CardContent className="py-8 space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold">오늘의 스크럼이 완성되었습니다!</h2>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            할 일 {items.length}건
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            총 {totalHours}h{remainMinutes > 0 ? ` ${remainMinutes}m` : ""}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              가용 {utilization}%
            </Badge>
          </div>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          {items.map((item, idx) => {
            const config = PRIORITY_CONFIG[item.priority];
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 text-sm rounded-md border px-3 py-2"
              >
                <span className="font-medium text-muted-foreground w-5">
                  {idx + 1}.
                </span>
                <span className={cn("text-xs", config.color)}>&#9679;</span>
                <span className="flex-1 truncate">{item.title}</span>
                {item.time_block_start && item.time_block_end && (
                  <span className="text-xs text-muted-foreground">
                    {item.time_block_start}~{item.time_block_end}
                  </span>
                )}
                {item.generated_task_id && (
                  <Badge variant="outline" className="text-[10px]">
                    Task
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            수정하기
          </Button>
          <Button variant="outline" onClick={onReview}>
            <Moon className="h-4 w-4 mr-1" />
            하루 마감 회고
          </Button>
          <Button variant="ghost" asChild>
            <a href="/scrum/history">
              <History className="h-4 w-4 mr-1" />
              이력 보기
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

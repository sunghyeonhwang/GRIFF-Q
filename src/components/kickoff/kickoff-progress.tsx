"use client";

import { Progress } from "@/components/ui/progress";
import type { KickoffChecklistItem, KickoffAcknowledgment } from "@/lib/kickoff-constants";

interface KickoffProgressProps {
  checklistItems: KickoffChecklistItem[];
  acknowledgments: KickoffAcknowledgment[];
  totalMembers: number;
}

export function KickoffProgress({
  checklistItems,
  acknowledgments,
  totalMembers,
}: KickoffProgressProps) {
  const completedCount = checklistItems.filter((i) => i.is_completed).length;
  const totalItems = checklistItems.length;
  const ackCount = acknowledgments.length;
  const safeMembers = Math.max(totalMembers, 1);

  const checklistPct = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
  const ackPct = (ackCount / safeMembers) * 100;
  const overallPct = Math.round(checklistPct * 0.6 + ackPct * 0.4);

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">킥오프 진행률</span>
        <span className="text-muted-foreground">{overallPct}%</span>
      </div>
      <Progress value={overallPct} className="h-2" />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>체크리스트 {completedCount}/{totalItems}</span>
        <span>숙지 {ackCount}/{totalMembers}명</span>
      </div>
    </div>
  );
}

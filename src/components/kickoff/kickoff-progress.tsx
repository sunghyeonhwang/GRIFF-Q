import { Badge } from "@/components/ui/badge";
import type { KickoffStatus } from "@/types/kickoff.types";

interface KickoffProgressProps {
  total: number;
  completed: number;
  status: KickoffStatus;
}

const STATUS_CONFIG: Record<KickoffStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "초안", variant: "outline" },
  in_progress: { label: "진행중", variant: "secondary" },
  completed: { label: "완료", variant: "default" },
};

export function KickoffProgress({ total, completed, status }: KickoffProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const config = STATUS_CONFIG[status];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">킥오프 진행률</span>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          {completed}/{total} 완료 ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

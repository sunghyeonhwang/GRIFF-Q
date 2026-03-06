"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScrumItem } from "@/types/scrum.types";
import { PRIORITY_CONFIG } from "@/types/scrum.types";

interface ScrumEisenhowerProps {
  items: ScrumItem[];
}

const QUADRANTS = [
  { key: "urgent", label: "긴급 + 중요", priorities: ["urgent"] as const, className: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" },
  { key: "important", label: "중요 (긴급X)", priorities: ["important"] as const, className: "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20" },
  { key: "normal", label: "긴급 (중요X)", priorities: ["normal"] as const, className: "border-muted bg-muted/30" },
  { key: "later", label: "후순위", priorities: ["later"] as const, className: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" },
] as const;

export function ScrumEisenhower({ items }: ScrumEisenhowerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {QUADRANTS.map((q) => {
        const quadrantItems = items.filter((i) =>
          (q.priorities as readonly string[]).includes(i.priority)
        );
        return (
          <div
            key={q.key}
            className={cn(
              "rounded-lg border p-3 min-h-[100px]",
              q.className
            )}
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {q.label}
            </p>
            {quadrantItems.length === 0 ? (
              <p className="text-xs text-muted-foreground/50">항목 없음</p>
            ) : (
              <div className="space-y-1">
                {quadrantItems.map((item) => {
                  const config = PRIORITY_CONFIG[item.priority];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <span className={cn("text-xs", config.color)}>&#9679;</span>
                      <span className="truncate">{item.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

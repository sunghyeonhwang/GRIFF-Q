"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { ScrumItem } from "@/types/scrum.types";
import { PRIORITY_CONFIG } from "@/types/scrum.types";

interface TimelineBlock {
  type: "scrum" | "schedule" | "lunch";
  title: string;
  startSlot: number;
  slots: number;
  item?: ScrumItem;
  priority?: string;
}

interface ScrumTimelineProps {
  items: ScrumItem[];
  schedules: { title: string; start_time: string; end_time: string }[];
}

const START_HOUR = 9;
const END_HOUR = 18;
const SLOT_HEIGHT = 40;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;

function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - START_HOUR) * 2 + (m >= 30 ? 1 : 0);
}

function slotToTime(slot: number): string {
  const h = START_HOUR + Math.floor(slot / 2);
  const m = slot % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
}

export function ScrumTimeline({ items, schedules }: ScrumTimelineProps) {
  const blocks: TimelineBlock[] = [];

  // Lunch block (12:00~13:00)
  blocks.push({
    type: "lunch",
    title: "점심",
    startSlot: (12 - START_HOUR) * 2,
    slots: 2,
  });

  // Schedule blocks
  for (const s of schedules) {
    if (!s.start_time || !s.end_time) continue;
    const start = timeToSlot(s.start_time);
    const end = timeToSlot(s.end_time);
    if (start < end) {
      blocks.push({
        type: "schedule",
        title: s.title,
        startSlot: start,
        slots: end - start,
      });
    }
  }

  // Scrum item blocks (those with time_block_start/end)
  for (const item of items) {
    if (item.time_block_start && item.time_block_end) {
      const start = timeToSlot(item.time_block_start);
      const end = timeToSlot(item.time_block_end);
      if (start < end) {
        blocks.push({
          type: "scrum",
          title: item.title,
          startSlot: start,
          slots: end - start,
          item,
          priority: item.priority,
        });
      }
    }
  }

  // Total allocated time
  const scrumBlocks = blocks.filter((b) => b.type === "scrum");
  const totalMinutes = scrumBlocks.reduce((sum, b) => sum + b.slots * 30, 0);
  const scheduleMinutes = blocks
    .filter((b) => b.type === "schedule" || b.type === "lunch")
    .reduce((sum, b) => sum + b.slots * 30, 0);
  const availableMinutes = (END_HOUR - START_HOUR) * 60 - scheduleMinutes;
  const isOverloaded = totalMinutes > availableMinutes;

  return (
    <div className="space-y-3">
      <div className="relative" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>
        {/* Time labels + grid */}
        {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 flex items-start scrum-timeline-slot"
            style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
          >
            <span className="w-14 shrink-0 text-xs text-muted-foreground pr-2 text-right">
              {i % 2 === 0 ? slotToTime(i) : ""}
            </span>
            <div className="flex-1 border-b border-border/30 h-full" />
          </div>
        ))}

        {/* Blocks */}
        {blocks.map((block, i) => {
          const config = block.priority
            ? PRIORITY_CONFIG[block.priority as keyof typeof PRIORITY_CONFIG]
            : null;

          return (
            <div
              key={i}
              className={cn(
                "absolute left-16 right-2 rounded-md px-2 py-1 text-xs font-medium overflow-hidden scrum-timeline-block",
                block.type === "scrum" && config
                  ? cn(config.bgColor, config.color)
                  : "",
                block.type === "schedule" &&
                  "bg-muted text-muted-foreground border border-border scrum-timeline-block--schedule",
                block.type === "lunch" &&
                  "bg-muted/50 text-muted-foreground/70 border border-dashed border-border"
              )}
              style={{
                top: block.startSlot * SLOT_HEIGHT + 2,
                height: block.slots * SLOT_HEIGHT - 4,
              }}
            >
              <div className="flex items-center gap-1 h-full">
                {block.type === "schedule" && (
                  <Lock className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{block.title}</span>
                {block.type === "scrum" && block.item && (
                  <span className="ml-auto text-[10px] opacity-70">
                    {block.item.estimated_minutes}분
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span>
          총 {Math.floor(totalMinutes / 60)}h{totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}m` : ""}{" "}
          / 가용 {Math.floor(availableMinutes / 60)}h{availableMinutes % 60 > 0 ? ` ${availableMinutes % 60}m` : ""}
        </span>
        {isOverloaded ? (
          <Badge variant="destructive" className="text-xs">과부하</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">여유 있음</Badge>
        )}
      </div>
    </div>
  );
}

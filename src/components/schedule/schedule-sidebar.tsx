"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SCHEDULE_CATEGORY_CONFIG, type ScheduleCategory } from "@/types/schedule.types";

interface ScheduleSidebarProps {
  activeCategories: Set<ScheduleCategory>;
  onToggle: (cat: ScheduleCategory) => void;
  isMyScheduleOnly: boolean;
  onMyScheduleToggle: () => void;
}

const ALL_CATEGORIES = Object.keys(SCHEDULE_CATEGORY_CONFIG) as ScheduleCategory[];

export function ScheduleSidebar({
  activeCategories,
  onToggle,
  isMyScheduleOnly,
  onMyScheduleToggle,
}: ScheduleSidebarProps) {
  return (
    <div className="space-y-4">
      {/* 내 일정만 보기 */}
      <div className="flex items-center gap-2">
        <Switch
          id="my-schedule"
          checked={isMyScheduleOnly}
          onCheckedChange={onMyScheduleToggle}
        />
        <Label htmlFor="my-schedule" className="text-sm">
          내 일정만 보기
        </Label>
      </div>

      {/* 카테고리 필터 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">카테고리</p>
        {ALL_CATEGORIES.map((cat) => {
          const config = SCHEDULE_CATEGORY_CONFIG[cat];
          return (
            <div key={cat} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat}`}
                checked={activeCategories.has(cat)}
                onCheckedChange={() => onToggle(cat)}
              />
              <div
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <Label htmlFor={`cat-${cat}`} className="text-sm">
                {config.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

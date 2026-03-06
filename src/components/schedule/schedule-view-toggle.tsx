"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, CalendarDays, Clock } from "lucide-react";

export type ScheduleViewType = "month" | "week" | "day";

interface ScheduleViewToggleProps {
  currentView: ScheduleViewType;
  onViewChange: (view: ScheduleViewType) => void;
}

const VIEW_OPTIONS: { value: ScheduleViewType; icon: React.ElementType; label: string }[] = [
  { value: "month", icon: Calendar, label: "월" },
  { value: "week", icon: CalendarDays, label: "주" },
  { value: "day", icon: Clock, label: "일" },
];

export function ScheduleViewToggle({ currentView, onViewChange }: ScheduleViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={currentView}
      onValueChange={(v) => v && onViewChange(v as ScheduleViewType)}
    >
      {VIEW_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        return (
          <ToggleGroupItem key={opt.value} value={opt.value} aria-label={opt.label} size="sm">
            <Icon className="size-4 mr-1" />
            <span className="text-xs">{opt.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

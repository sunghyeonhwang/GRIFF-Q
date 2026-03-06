"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildSearchParamsString } from "@/lib/pagination";
import {
  List,
  LayoutGrid,
  Calendar,
  GanttChart,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type ProjectViewType = "list" | "board" | "calendar" | "gantt";

const VIEW_OPTIONS: {
  value: ProjectViewType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "list", label: "리스트", icon: List },
  { value: "board", label: "보드", icon: LayoutGrid },
  { value: "calendar", label: "캘린더", icon: Calendar },
  { value: "gantt", label: "간트", icon: GanttChart },
];

interface ProjectViewToggleProps {
  currentView: ProjectViewType;
  searchParams: Record<string, string | string[] | undefined>;
}

export function ProjectViewToggle({
  currentView,
  searchParams,
}: ProjectViewToggleProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="inline-flex items-center rounded-md border p-0.5 gap-0.5">
        {VIEW_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.value;
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <Link
                  href={buildSearchParamsString(searchParams, {
                    view: option.value,
                    page: undefined,
                  })}
                  className={cn(
                    "inline-flex items-center justify-center rounded-sm p-1.5 transition-colors",
                    isActive
                      ? "bg-brand text-brand-foreground"
                      : "hover:bg-brand-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {option.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

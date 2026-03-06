"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LayoutList, Columns3, Calendar, BarChart3, GitBranch } from "lucide-react";

export type TaskViewType = "list" | "board" | "calendar" | "gantt" | "node";

const VIEW_OPTIONS: {
  value: TaskViewType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "list", label: "목록", icon: LayoutList },
  { value: "board", label: "보드", icon: Columns3 },
  { value: "calendar", label: "캘린더", icon: Calendar },
  { value: "gantt", label: "간트", icon: BarChart3 },
  { value: "node", label: "노드", icon: GitBranch },
];

interface TaskViewToggleProps {
  currentView: TaskViewType;
}

export function TaskViewToggle({ currentView }: TaskViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleView(view: TaskViewType) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center border rounded-lg p-0.5 gap-0.5">
        {VIEW_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.value;
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2 gap-1.5 text-xs"
                  onClick={() => handleView(option.value)}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs sm:hidden">
                {option.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import {
  type TaskPriority,
  TASK_PRIORITY_CONFIG,
} from "@/types/task.types";

const colorMap: Record<string, string> = {
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
};

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const config = TASK_PRIORITY_CONFIG[priority];
  const colors = colorMap[config.color] ?? colorMap.gray;

  return (
    <Badge variant="outline" className={`text-xs font-medium ${colors} ${className ?? ""}`}>
      {config.label}
    </Badge>
  );
}

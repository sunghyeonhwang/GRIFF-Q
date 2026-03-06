"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import {
  Circle,
  Timer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  User,
} from "lucide-react";
import type { TaskStatus, TaskPriority } from "@/types/task.types";
import { TASK_PRIORITY_CONFIG } from "@/types/task.types";
import { cn } from "@/lib/utils";

export type TaskNodeData = {
  taskId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName: string | null;
  dueDate: string | null;
  isOverdue: boolean;
  isCriticalPath: boolean;
  isHighlighted: boolean;
};

type TaskNodeType = Node<TaskNodeData, "taskNode">;

const STATUS_ICONS: Record<TaskStatus, React.ElementType> = {
  pending: Circle,
  in_progress: Timer,
  review: Eye,
  completed: CheckCircle2,
  issue: AlertTriangle,
};

const STATUS_BG: Record<TaskStatus, string> = {
  pending: "bg-gray-50 border-gray-300 dark:bg-gray-900 dark:border-gray-600",
  in_progress: "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-600",
  review: "bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-600",
  completed: "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-600",
  issue: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-600",
};

const STATUS_ICON_COLOR: Record<TaskStatus, string> = {
  pending: "text-gray-500",
  in_progress: "text-blue-500",
  review: "text-yellow-600 dark:text-yellow-400",
  completed: "text-green-500",
  issue: "text-red-500",
};

const PRIORITY_BADGE_VARIANT: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function TaskNodeComponent({ data, selected }: NodeProps<TaskNodeType>) {
  const StatusIcon = STATUS_ICONS[data.status];
  const priorityConfig = TASK_PRIORITY_CONFIG[data.priority];

  return (
    <div
      className={cn(
        "w-[200px] rounded-lg border-2 px-3 py-2.5 shadow-sm transition-all",
        STATUS_BG[data.status],
        selected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-950",
        data.isCriticalPath && "ring-2 ring-orange-400 ring-offset-1",
        data.isHighlighted === false && "opacity-30",
        data.isOverdue && "border-red-500 dark:border-red-400"
      )}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary !-top-1.5"
      />

      {/* Header: Status Icon + Title */}
      <div className="flex items-start gap-2 mb-1.5">
        <StatusIcon
          className={cn("size-4 mt-0.5 shrink-0", STATUS_ICON_COLOR[data.status])}
        />
        <span className="text-sm font-medium leading-tight line-clamp-2 flex-1">
          {data.title}
        </span>
      </div>

      {/* Footer: Assignee + Priority */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate min-w-0">
          <User className="size-3 shrink-0" />
          <span className="truncate">
            {data.assigneeName || "미배정"}
          </span>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "text-[10px] px-1.5 py-0 h-4 shrink-0",
            PRIORITY_BADGE_VARIANT[data.priority]
          )}
        >
          {priorityConfig.label}
        </Badge>
      </div>

      {/* Due date indicator */}
      {data.dueDate && (
        <div
          className={cn(
            "text-[10px] mt-1 text-muted-foreground",
            data.isOverdue && "text-red-600 dark:text-red-400 font-medium"
          )}
        >
          {data.isOverdue ? "지연: " : "마감: "}
          {data.dueDate}
        </div>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary !-bottom-1.5"
      />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);

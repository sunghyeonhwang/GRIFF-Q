"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type TaskStatus,
  TASK_STATUS_CONFIG,
  KANBAN_COLUMNS,
} from "@/types/task.types";
import { updateTaskStatus } from "@/actions/task";
import { toast } from "sonner";
import {
  Circle,
  Timer,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Circle,
  Timer,
  Eye,
  CheckCircle2,
  AlertTriangle,
};

const dotColorMap: Record<string, string> = {
  gray: "text-gray-500",
  blue: "text-blue-500",
  yellow: "text-yellow-500",
  green: "text-green-500",
  red: "text-red-500",
};

interface TaskStatusSelectProps {
  taskId: string;
  currentStatus: TaskStatus;
  onStatusChange?: (status: TaskStatus) => void;
}

export function TaskStatusSelect({
  taskId,
  currentStatus,
  onStatusChange,
}: TaskStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const newStatus = value as TaskStatus;
    setStatus(newStatus);
    onStatusChange?.(newStatus);

    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, newStatus);
        toast.success("상태가 변경되었습니다.");
      } catch {
        setStatus(currentStatus);
        toast.error("상태 변경 실패");
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {KANBAN_COLUMNS.map((s) => {
          const config = TASK_STATUS_CONFIG[s];
          const Icon = iconMap[config.icon] ?? Circle;
          return (
            <SelectItem key={s} value={s}>
              <div className="flex items-center gap-2">
                <Icon className={`size-3.5 ${dotColorMap[config.color] ?? ""}`} />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

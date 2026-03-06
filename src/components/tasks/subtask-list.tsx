"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createTask, updateTaskStatus, deleteTask } from "@/actions/task";
import type { Task, TaskStatus } from "@/types/task.types";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface SubtaskListProps {
  parentTask: Task;
  subtasks: Task[];
  projectId?: string | null;
}

export function SubtaskList({
  parentTask,
  subtasks,
  projectId,
}: SubtaskListProps) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, startAddTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const completedCount = subtasks.filter(
    (s) => s.status === "completed"
  ).length;
  const totalCount = subtasks.length;
  const progressValue = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function handleAddSubtask() {
    const title = newTitle.trim();
    if (!title) {
      toast.error("서브태스크 제목을 입력해주세요.");
      return;
    }

    startAddTransition(async () => {
      try {
        await createTask({
          title,
          project_id: projectId || undefined,
          parent_task_id: parentTask.id,
          priority: "normal",
          weight: 1,
        });
        setNewTitle("");
        toast.success("서브태스크가 추가되었습니다.");
        router.refresh();
      } catch {
        toast.error("서브태스크 추가 실패");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAddSubtask();
    }
  }

  async function handleToggle(subtask: Task) {
    setTogglingId(subtask.id);
    try {
      const newStatus: TaskStatus =
        subtask.status === "completed" ? "pending" : "completed";
      await updateTaskStatus(subtask.id, newStatus);
      toast.success(
        newStatus === "completed"
          ? "서브태스크 완료"
          : "서브태스크 대기로 변경"
      );
      router.refresh();
    } catch {
      toast.error("상태 변경 실패");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(subtaskId: string) {
    setDeletingId(subtaskId);
    try {
      await deleteTask(subtaskId);
      toast.success("서브태스크가 삭제되었습니다.");
      router.refresh();
    } catch {
      toast.error("서브태스크 삭제 실패");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          서브태스크
          <span className="ml-1.5 text-muted-foreground">
            ({completedCount}/{totalCount})
          </span>
        </h4>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {progressValue}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <Progress value={progressValue} className="h-1.5" />
      )}

      {/* Subtask checklist */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
          >
            {togglingId === subtask.id ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
            ) : (
              <Checkbox
                checked={subtask.status === "completed"}
                onCheckedChange={() => handleToggle(subtask)}
                className="shrink-0"
              />
            )}
            <span
              className={`flex-1 text-sm ${
                subtask.status === "completed"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(subtask.id)}
              disabled={deletingId === subtask.id}
            >
              {deletingId === subtask.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="서브태스크 추가..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAdding}
          className="h-8 text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleAddSubtask}
          disabled={isAdding || !newTitle.trim()}
        >
          {isAdding ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

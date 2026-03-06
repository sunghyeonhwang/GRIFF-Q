"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusSelect } from "./task-status-select";
import { SubtaskList } from "./subtask-list";
import { updateTask, deleteTask } from "@/actions/task";
import {
  type Task,
  type TaskPriority,
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
} from "@/types/task.types";
import { toast } from "sonner";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  CalendarDays,
  Clock,
  Pencil,
  Save,
  Trash2,
  Weight,
  X,
} from "lucide-react";

interface User {
  id: string;
  name: string;
}

interface TaskDetailPanelProps {
  task: Task | null;
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtasks?: Task[];
  blockedBy?: Task[];
  blocks?: Task[];
}

export function TaskDetailPanel({
  task,
  users,
  open,
  onOpenChange,
  subtasks = [],
  blockedBy = [],
  blocks = [],
}: TaskDetailPanelProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [, startDeleteTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal" as TaskPriority,
    assignee_id: "",
    due_date: "",
    estimated_hours: "",
    weight: "1",
    labels: "",
  });

  function startEdit() {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      assignee_id: task.assignee_id ?? "",
      due_date: task.due_date ?? "",
      estimated_hours: task.estimated_hours?.toString() ?? "",
      weight: task.weight?.toString() ?? "1",
      labels: task.labels?.join(", ") ?? "",
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleSave() {
    if (!task) return;
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await updateTask(task.id, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          priority: form.priority,
          assignee_id: form.assignee_id || null,
          due_date: form.due_date || null,
          estimated_hours: form.estimated_hours
            ? Number(form.estimated_hours)
            : null,
          weight: form.weight ? Number(form.weight) : 1,
          labels: form.labels
            ? form.labels.split(",").map((l) => l.trim()).filter(Boolean)
            : [],
        });
        toast.success("Task가 수정되었습니다.");
        setEditing(false);
        router.refresh();
      } catch {
        toast.error("수정 실패");
      }
    });
  }

  function handleDelete() {
    if (!task) return;
    startDeleteTransition(async () => {
      try {
        await deleteTask(task.id);
        toast.success("Task가 삭제되었습니다.");
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error("삭제 실패");
      }
    });
  }

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {editing ? "Task 편집" : "Task 상세"}
          </SheetTitle>
          <SheetDescription>
            {task.project_id ? "프로젝트 Task" : "독립 Task"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status + Priority row */}
          <div className="flex items-center gap-3">
            <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>

          <Separator />

          {editing ? (
            /* ── Edit Mode ── */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>우선순위</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      setForm({ ...form, priority: v as TaskPriority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(TASK_PRIORITY_CONFIG) as [
                          TaskPriority,
                          (typeof TASK_PRIORITY_CONFIG)[TaskPriority],
                        ][]
                      ).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>담당자</Label>
                  <Select
                    value={form.assignee_id || "__none__"}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        assignee_id: v === "__none__" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">미배정</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>마감일</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm({ ...form, due_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>예상 시간</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimated_hours}
                    onChange={(e) =>
                      setForm({ ...form, estimated_hours: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>가중치</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>라벨</Label>
                <Input
                  placeholder="쉼표로 구분"
                  value={form.labels}
                  onChange={(e) =>
                    setForm({ ...form, labels: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <LoadingButton
                  loading={isPending}
                  onClick={handleSave}
                  size="sm"
                  className="gap-1.5"
                >
                  <Save className="size-3.5" />
                  저장
                </LoadingButton>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={isPending}
                  className="gap-1.5"
                >
                  <X className="size-3.5" />
                  취소
                </Button>
              </div>
            </div>
          ) : (
            /* ── View Mode ── */
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                {task.description && (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span>마감일:</span>
                  <span className="text-foreground">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString("ko-KR")
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  <span>예상:</span>
                  <span className="text-foreground">
                    {task.estimated_hours
                      ? `${task.estimated_hours}h`
                      : "-"}
                  </span>
                  {task.actual_hours != null && (
                    <>
                      <span>/</span>
                      <span>실제: {task.actual_hours}h</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Weight className="size-4" />
                  <span>가중치:</span>
                  <span className="text-foreground">{task.weight}</span>
                </div>
              </div>

              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Assignee */}
              <div className="text-sm">
                <span className="text-muted-foreground">담당자: </span>
                <span>{task.assignee?.name ?? "미배정"}</span>
              </div>

              {/* Subtasks */}
              <Separator />
              <SubtaskList
                parentTask={task}
                subtasks={subtasks}
                projectId={task.project_id}
              />

              {/* Dependencies */}
              {(blockedBy.length > 0 || blocks.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">의존성 관계</h4>

                    {blockedBy.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ArrowLeftFromLine className="size-3" />
                          선행 Task (Blocked by)
                        </p>
                        {blockedBy.map((dep) => (
                          <div
                            key={dep.id}
                            className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
                          >
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0"
                              style={{
                                borderColor: `var(--color-${TASK_STATUS_CONFIG[dep.status]?.color || "gray"})`,
                              }}
                            >
                              {TASK_STATUS_CONFIG[dep.status]?.label || dep.status}
                            </Badge>
                            <span className="text-sm truncate">{dep.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {blocks.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ArrowRightFromLine className="size-3" />
                          후행 Task (Blocks)
                        </p>
                        {blocks.map((dep) => (
                          <div
                            key={dep.id}
                            className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
                          >
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0"
                              style={{
                                borderColor: `var(--color-${TASK_STATUS_CONFIG[dep.status]?.color || "gray"})`,
                              }}
                            >
                              {TASK_STATUS_CONFIG[dep.status]?.label || dep.status}
                            </Badge>
                            <span className="text-sm truncate">{dep.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="gap-1.5"
                >
                  <Pencil className="size-3.5" />
                  편집
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Task를 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. Task &quot;{task.title}&quot;이(가) 영구적으로 삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p>
                  생성:{" "}
                  {new Date(task.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {task.completed_at && (
                  <p>
                    완료:{" "}
                    {new Date(task.completed_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

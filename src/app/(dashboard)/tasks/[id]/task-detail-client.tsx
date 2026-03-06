"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateTask, deleteTask } from "@/actions/task";
import { type Task, type TaskStatus, TASK_STATUS_CONFIG } from "@/types/task.types";

interface User {
  id: string;
  name: string;
}

interface TaskDetailClientProps {
  task: Task;
  users: User[];
}

export function TaskDetailClient({ task, users }: TaskDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleStatusChange(status: TaskStatus) {
    startTransition(async () => {
      try {
        await updateTask(task.id, { status });
        toast.success("상태가 변경되었습니다.");
        router.refresh();
      } catch (err) {
        toast.error("상태 변경 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    });
  }

  function handleAssigneeChange(assigneeId: string) {
    startTransition(async () => {
      try {
        await updateTask(task.id, {
          assignee_id: assigneeId === "__none__" ? null : assigneeId,
        });
        toast.success("담당자가 변경되었습니다.");
        router.refresh();
      } catch (err) {
        toast.error("담당자 변경 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteTask(task.id);
        toast.success("Task가 삭제되었습니다.");
        const backUrl = task.project_id
          ? `/projects/${task.project_id}/tasks`
          : "/tasks";
        router.push(backUrl);
      } catch (err) {
        toast.error("삭제 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">빠른 편집</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">상태</p>
          <Select
            value={task.status}
            onValueChange={(v) => handleStatusChange(v as TaskStatus)}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TASK_STATUS_CONFIG) as [TaskStatus, { label: string }][]).map(
                ([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-sm">
                    {cfg.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Assignee */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">담당자</p>
          <Select
            value={task.assignee_id ?? "__none__"}
            onValueChange={handleAssigneeChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="미배정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-sm">
                미배정
              </SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-sm">
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive/40 hover:bg-destructive/10"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 size-3.5" />
              Task 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Task를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{task.title}&rdquo;을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

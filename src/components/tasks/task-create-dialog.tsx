"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTask } from "@/actions/task";
import { TASK_PRIORITY_CONFIG, type TaskPriority } from "@/types/task.types";

interface User {
  id: string;
  name: string;
}

interface TaskCreateDialogProps {
  projectId?: string;
  users: User[];
}

const initialForm = {
  title: "",
  description: "",
  priority: "normal" as TaskPriority,
  assignee_id: "",
  due_date: "",
  estimated_hours: "",
  weight: "1",
  labels: "",
};

export function TaskCreateDialog({ projectId, users }: TaskCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialForm);

  function resetForm() {
    setForm(initialForm);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Task 제목을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await createTask({
          project_id: projectId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          assignee_id: form.assignee_id || undefined,
          due_date: form.due_date || undefined,
          estimated_hours: form.estimated_hours
            ? Number(form.estimated_hours)
            : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          labels: form.labels
            ? form.labels.split(",").map((l) => l.trim()).filter(Boolean)
            : undefined,
        });

        toast.success("Task가 생성되었습니다.");
        resetForm();
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Task 생성 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Task 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>새 Task 생성</DialogTitle>
          <DialogDescription>
            {projectId
              ? "프로젝트에 새 Task를 추가합니다."
              : "독립 Task를 생성합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="Task 제목을 입력하세요"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-desc">설명</Label>
            <Textarea
              id="task-desc"
              placeholder="Task 설명 (선택)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Priority + Assignee row */}
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
                value={form.assignee_id}
                onValueChange={(v) =>
                  setForm({ ...form, assignee_id: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
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

          {/* Due date + Estimated hours + Weight */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-due">마감일</Label>
              <Input
                id="task-due"
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm({ ...form, due_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-hours">예상 시간</Label>
              <Input
                id="task-hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="h"
                value={form.estimated_hours}
                onChange={(e) =>
                  setForm({ ...form, estimated_hours: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-weight">가중치</Label>
              <Input
                id="task-weight"
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

          {/* Labels */}
          <div className="space-y-2">
            <Label htmlFor="task-labels">라벨</Label>
            <Input
              id="task-labels"
              placeholder="쉼표로 구분 (예: 디자인, 프론트엔드)"
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <LoadingButton loading={isPending} onClick={handleSubmit}>
              생성
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

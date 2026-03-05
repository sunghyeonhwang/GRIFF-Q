"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface ProjectEditDialogProps {
  project: {
    id: string;
    name: string;
    status: string;
    lead_user_id: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  };
  users: { id: string; name: string }[];
}

export function ProjectEditDialog({ project, users }: ProjectEditDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    start_date: project.start_date ?? "",
    end_date: project.end_date ?? "",
    lead_user_id: project.lead_user_id ?? "",
  });

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setForm({
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
        lead_user_id: project.lead_user_id ?? "",
      });
    }
    setOpen(isOpen);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("프로젝트명을 입력해주세요.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name: form.name,
        title: form.name,
        description: form.description || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        lead_user_id: form.lead_user_id || null,
      })
      .eq("id", project.id);

    setLoading(false);

    if (error) {
      toast.error("프로젝트 수정 실패", { description: error.message });
      return;
    }

    toast.success("프로젝트가 수정되었습니다");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>프로젝트 수정</DialogTitle>
          <DialogDescription>
            프로젝트 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>프로젝트명 *</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="프로젝트명을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="프로젝트에 대한 설명을 입력하세요."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">진행 중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="on_hold">보류</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>담당자</Label>
              <Select
                value={form.lead_user_id}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, lead_user_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, start_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, end_date: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <LoadingButton onClick={handleSubmit} loading={loading} loadingText="저장 중...">
              저장
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

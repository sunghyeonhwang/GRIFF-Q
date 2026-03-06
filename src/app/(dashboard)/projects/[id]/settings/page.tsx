"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProject, archiveProject } from "@/actions/project";
import type { Project, ProjectType } from "@/types/project.types";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "general", label: "일반" },
  { value: "event", label: "행사" },
  { value: "content", label: "콘텐츠" },
  { value: "maintenance", label: "유지보수" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "진행중" },
  { value: "on_hold", label: "보류" },
  { value: "completed", label: "완료" },
] as const;

export default function ProjectSettingsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isArchiving, startArchiveTransition] = useTransition();

  const [form, setForm] = useState({
    name: "",
    description: "",
    project_type: "general" as ProjectType,
    status: "active" as Project["status"],
    start_date: "",
    end_date: "",
    priority: "3",
    color: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setProject(data as Project);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          project_type: (data.project_type ?? "general") as ProjectType,
          status: (data.status ?? "active") as Project["status"],
          start_date: data.start_date ?? "",
          end_date: data.end_date ?? "",
          priority: String(data.priority ?? 3),
          color: data.color ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("프로젝트 이름을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await updateProject(id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          project_type: form.project_type,
          status: form.status,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          priority: Number(form.priority) || 3,
          color: form.color.trim() || null,
        } as Parameters<typeof updateProject>[1]);
        toast.success("프로젝트 설정이 저장되었습니다.");
        router.refresh();
      } catch (err) {
        toast.error("저장 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    });
  }

  function handleArchive() {
    startArchiveTransition(async () => {
      try {
        await archiveProject(id);
        toast.success("프로젝트가 보관되었습니다.");
        router.push("/projects");
      } catch (err) {
        toast.error("보관 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        프로젝트를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">프로젝트 설정</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>프로젝트 이름, 유형, 상태 등을 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="proj-name">
              프로젝트 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proj-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="프로젝트 이름"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="proj-desc">설명</Label>
            <Textarea
              id="proj-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="프로젝트 설명 (선택)"
              rows={3}
            />
          </div>

          {/* 종류 + 상태 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>프로젝트 종류</Label>
              <Select
                value={form.project_type}
                onValueChange={(v) =>
                  setForm({ ...form, project_type: v as ProjectType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as Project["status"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 시작일 + 종료일 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proj-start">시작일</Label>
              <Input
                id="proj-start"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-end">종료일</Label>
              <Input
                id="proj-end"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* 우선순위 + 색상 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proj-priority">우선순위 (1-10)</Label>
              <Input
                id="proj-priority"
                type="number"
                min="1"
                max="10"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-color">색상 (hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="proj-color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#3b82f6"
                />
                {form.color && (
                  <div
                    className="size-10 rounded-md border shrink-0"
                    style={{ backgroundColor: form.color }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <LoadingButton loading={isPending} onClick={handleSave}>
              저장
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 위험 구역 */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">위험 구역</CardTitle>
          <CardDescription>
            되돌리기 어려운 작업입니다. 신중하게 진행하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">프로젝트 보관</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                프로젝트를 보관 처리합니다. 목록에서 숨겨지며 언제든 복원 가능합니다.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isArchiving}>
                  {isArchiving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 size-4" />
                  )}
                  보관
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>프로젝트를 보관하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{project.name}&rdquo; 프로젝트를 보관합니다. 프로젝트 목록에서
                    숨겨지지만 데이터는 삭제되지 않습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleArchive}
                  >
                    보관
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

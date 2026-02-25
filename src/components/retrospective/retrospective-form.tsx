"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLES } from "@/lib/retrospective-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface RetrospectiveData {
  id?: string;
  project_id: string;
  period_start: string;
  period_end: string;
  roles: string[];
  keep: string[];
  problem: string[];
  try: string[];
  start_items: string[];
  stop: string[];
  continue_items: string[];
  team_share_note: string;
  next_action_note: string;
  status: string;
}

interface RetrospectiveFormProps {
  userId: string;
  userName: string;
  projects: Project[];
  initialData?: any;
  readOnly?: boolean;
}

export function RetrospectiveForm({
  userId,
  userName,
  projects,
  initialData,
  readOnly = false,
}: RetrospectiveFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [form, setForm] = useState<RetrospectiveData>({
    project_id: initialData?.project_id ?? "",
    period_start: initialData?.period_start ?? "",
    period_end: initialData?.period_end ?? "",
    roles: initialData?.roles ?? [],
    keep: initialData?.keep?.length ? initialData.keep : [""],
    problem: initialData?.problem?.length ? initialData.problem : [""],
    try: initialData?.try?.length ? initialData.try : [""],
    start_items: initialData?.start_items?.length ? initialData.start_items : [""],
    stop: initialData?.stop?.length ? initialData.stop : [""],
    continue_items: initialData?.continue_items?.length ? initialData.continue_items : [""],
    team_share_note: initialData?.team_share_note ?? "",
    next_action_note: initialData?.next_action_note ?? "",
    status: initialData?.status ?? "draft",
  });

  function toggleRole(role: string) {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  }

  function updateListItem(
    field: keyof RetrospectiveData,
    index: number,
    value: string
  ) {
    setForm((prev) => {
      const list = [...(prev[field] as string[])];
      list[index] = value;
      return { ...prev, [field]: list };
    });
  }

  function addListItem(field: keyof RetrospectiveData) {
    setForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ""],
    }));
  }

  function removeListItem(field: keyof RetrospectiveData, index: number) {
    setForm((prev) => {
      const list = (prev[field] as string[]).filter((_, i) => i !== index);
      return { ...prev, [field]: list.length ? list : [""] };
    });
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newProjectName.trim(), created_by: userId })
      .select("id, name")
      .single();

    if (error) {
      alert("프로젝트 생성 실패: " + error.message);
      return;
    }
    if (data) {
      setForm((prev) => ({ ...prev, project_id: data.id }));
      setNewProjectName("");
      setShowNewProject(false);
      router.refresh();
    }
  }

  async function save(status: "draft" | "submitted") {
    if (!form.project_id) {
      alert("프로젝트를 선택해주세요.");
      return;
    }
    if (!form.period_start || !form.period_end) {
      alert("회고 기간을 입력해주세요.");
      return;
    }
    if (form.roles.length === 0) {
      alert("역할을 하나 이상 선택해주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      project_id: form.project_id,
      author_id: userId,
      period_start: form.period_start,
      period_end: form.period_end,
      roles: form.roles,
      keep: form.keep.filter((v) => v.trim()),
      problem: form.problem.filter((v) => v.trim()),
      try: form.try.filter((v) => v.trim()),
      start_items: form.start_items.filter((v) => v.trim()),
      stop: form.stop.filter((v) => v.trim()),
      continue_items: form.continue_items.filter((v) => v.trim()),
      team_share_note: form.team_share_note,
      next_action_note: form.next_action_note,
      status,
      ...(status === "submitted" ? { submitted_at: new Date().toISOString() } : {}),
    };

    let error;
    if (initialData?.id) {
      ({ error } = await supabase
        .from("retrospectives")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("retrospectives").insert(payload));
    }

    setLoading(false);

    if (error) {
      alert("저장 실패: " + error.message);
      return;
    }

    router.push("/retrospective");
    router.refresh();
  }

  function renderListSection(
    title: string,
    field: keyof RetrospectiveData,
    placeholder: string
  ) {
    const items = form[field] as string[];
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{title}</Label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={item}
              onChange={(e) => updateListItem(field, i, e.target.value)}
              placeholder={placeholder}
              rows={2}
              disabled={readOnly}
              className="flex-1"
            />
            {!readOnly && items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem(field, i)}
                className="shrink-0"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem(field)}
          >
            <Plus className="mr-1 size-3" />
            항목 추가
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>작성자</Label>
            <Input value={userName} disabled />
          </div>

          <div className="space-y-2">
            <Label>프로젝트</Label>
            <div className="flex gap-2">
              <Select
                value={form.project_id}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, project_id: v }))
                }
                disabled={readOnly}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewProject(true)}
                >
                  <Plus className="mr-1 size-4" />새 프로젝트
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={form.period_start}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, period_start: e.target.value }))
                }
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={form.period_end}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, period_end: e.target.value }))
                }
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>역할 (복수 선택)</Label>
            <div className="flex flex-wrap gap-3">
              {ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-1.5 text-sm"
                >
                  <Checkbox
                    checked={form.roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                    disabled={readOnly}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPT */}
      <Card>
        <CardHeader>
          <CardTitle>KPT</CardTitle>
          <CardDescription>Keep / Problem / Try</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderListSection("Keep (유지할 것)", "keep", "잘 되고 있어서 계속 유지하고 싶은 것")}
          {renderListSection("Problem (문제점)", "problem", "개선이 필요한 문제점")}
          {renderListSection("Try (시도할 것)", "try", "다음에 시도해볼 것")}
        </CardContent>
      </Card>

      {/* SSC */}
      <Card>
        <CardHeader>
          <CardTitle>SSC</CardTitle>
          <CardDescription>Start / Stop / Continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderListSection("Start (시작할 것)", "start_items", "새로 시작해야 할 것")}
          {renderListSection("Stop (멈출 것)", "stop", "더 이상 하지 말아야 할 것")}
          {renderListSection("Continue (계속할 것)", "continue_items", "계속 이어가야 할 것")}
        </CardContent>
      </Card>

      {/* 공유 메모 */}
      <Card>
        <CardHeader>
          <CardTitle>공유 메모 (선택)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>팀에 꼭 공유하고 싶은 포인트</Label>
            <Textarea
              value={form.team_share_note}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  team_share_note: e.target.value,
                }))
              }
              placeholder="팀에 공유하고 싶은 내용을 자유롭게 작성하세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>다음 프로젝트에 바로 반영할 사항</Label>
            <Textarea
              value={form.next_action_note}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  next_action_note: e.target.value,
                }))
              }
              placeholder="다음 프로젝트에 즉시 적용할 사항을 작성하세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      {!readOnly && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => save("draft")}
            disabled={loading}
          >
            {loading ? "저장 중..." : "임시 저장"}
          </Button>
          <Button
            onClick={() => setShowSubmitDialog(true)}
            disabled={loading}
          >
            제출
          </Button>
        </div>
      )}

      {/* 제출 확인 다이얼로그 */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회고를 제출하시겠습니까?</DialogTitle>
            <DialogDescription>
              제출 후에는 수정할 수 없습니다. (관리자만 수정 가능)
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                setShowSubmitDialog(false);
                save("submitted");
              }}
            >
              제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 새 프로젝트 다이얼로그 */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 프로젝트</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>프로젝트명</Label>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="프로젝트 이름 입력"
              onKeyDown={(e) => e.key === "Enter" && createProject()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>
              취소
            </Button>
            <Button onClick={createProject}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

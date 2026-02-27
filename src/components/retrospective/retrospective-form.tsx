"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ROLES,
  EVALUATION_PARTS,
  SATISFACTION_ITEMS,
  SCORE_LABELS,
  type PartEvaluation,
} from "@/lib/retrospective-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

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
  // 만족도 점수
  satisfaction_scores: Record<string, number>;
  // 파트별 평가
  part_evaluations: PartEvaluation[];
  // KPT
  keep: string[];
  problem: string[];
  try: string[];
  // SSC
  start_items: string[];
  stop: string[];
  continue_items: string[];
  // 종합 의견
  overall_best: string;
  overall_worst: string;
  overall_improvement: string;
  overall_message: string;
  // 공유 메모 (기존 유지)
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

function initPartEvaluations(existing?: PartEvaluation[]): PartEvaluation[] {
  return EVALUATION_PARTS.map((part) => {
    const found = existing?.find((e) => e.part === part);
    return found ?? { part, score: 0, good: "", bad: "", reason: "", improvement: "" };
  });
}

function ScoreSelector({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`flex size-8 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
            value === n
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input hover:bg-accent"
          } ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}
          title={SCORE_LABELS[n]}
        >
          {n}
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-xs text-muted-foreground">
          {SCORE_LABELS[value]}
        </span>
      )}
    </div>
  );
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
    satisfaction_scores: initialData?.satisfaction_scores ?? {},
    part_evaluations: initPartEvaluations(initialData?.part_evaluations),
    keep: initialData?.keep?.length ? initialData.keep : [""],
    problem: initialData?.problem?.length ? initialData.problem : [""],
    try: initialData?.try?.length ? initialData.try : [""],
    start_items: initialData?.start_items?.length ? initialData.start_items : [""],
    stop: initialData?.stop?.length ? initialData.stop : [""],
    continue_items: initialData?.continue_items?.length ? initialData.continue_items : [""],
    overall_best: initialData?.overall_best ?? "",
    overall_worst: initialData?.overall_worst ?? "",
    overall_improvement: initialData?.overall_improvement ?? "",
    overall_message: initialData?.overall_message ?? "",
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

  function setSatisfaction(key: string, value: number) {
    setForm((prev) => ({
      ...prev,
      satisfaction_scores: { ...prev.satisfaction_scores, [key]: value },
    }));
  }

  function updatePartEval(index: number, field: keyof PartEvaluation, value: string | number) {
    setForm((prev) => {
      const evals = [...prev.part_evaluations];
      evals[index] = { ...evals[index], [field]: value };
      return { ...prev, part_evaluations: evals };
    });
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
      toast.error("프로젝트 생성 실패", { description: error.message });
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
      toast.error("프로젝트를 선택해주세요.");
      return;
    }
    if (!form.period_start || !form.period_end) {
      toast.error("회고 기간을 입력해주세요.");
      return;
    }
    if (form.roles.length === 0) {
      toast.error("역할을 하나 이상 선택해주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // 점수 0인 파트 평가는 빈 값으로 처리
    const filledEvals = form.part_evaluations.filter((e) => e.score > 0);

    const payload = {
      project_id: form.project_id,
      author_id: userId,
      period_start: form.period_start,
      period_end: form.period_end,
      roles: form.roles,
      satisfaction_scores: form.satisfaction_scores,
      part_evaluations: filledEvals,
      keep: form.keep.filter((v) => v.trim()),
      problem: form.problem.filter((v) => v.trim()),
      try: form.try.filter((v) => v.trim()),
      start_items: form.start_items.filter((v) => v.trim()),
      stop: form.stop.filter((v) => v.trim()),
      continue_items: form.continue_items.filter((v) => v.trim()),
      overall_best: form.overall_best,
      overall_worst: form.overall_worst,
      overall_improvement: form.overall_improvement,
      overall_message: form.overall_message,
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
      toast.error("저장 실패", { description: error.message });
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

  // 만족도 평균 계산
  const satValues = Object.values(form.satisfaction_scores).filter((v) => v > 0);
  const satAvg = satValues.length > 0
    ? (satValues.reduce((a, b) => a + b, 0) / satValues.length).toFixed(1)
    : "-";

  // 파트 평가 평균
  const evalScores = form.part_evaluations.filter((e) => e.score > 0);
  const evalAvg = evalScores.length > 0
    ? (evalScores.reduce((a, b) => a + b.score, 0) / evalScores.length).toFixed(1)
    : "-";

  return (
    <div className="space-y-6">
      {/* 1. 기본 정보 */}
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
            <Label>담당 역할 (복수 선택)</Label>
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

      {/* 2. 프로젝트 전체 만족도 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-5" />
                프로젝트 전체 만족도
              </CardTitle>
              <CardDescription>각 항목에 1~5점으로 평가해주세요.</CardDescription>
            </div>
            {satAvg !== "-" && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                평균 {satAvg}점
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {SATISFACTION_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm font-medium">{item.label}</Label>
                <ScoreSelector
                  value={form.satisfaction_scores[item.key] ?? 0}
                  onChange={(v) => setSatisfaction(item.key, v)}
                  disabled={readOnly}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. 파트별 평가 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>파트별 평가</CardTitle>
              <CardDescription>
                각 파트에 대해 점수(1~5)와 의견을 작성해주세요. 평가할 파트만 작성하면 됩니다.
              </CardDescription>
            </div>
            {evalAvg !== "-" && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                평균 {evalAvg}점
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {form.part_evaluations.map((pe, idx) => (
              <AccordionItem key={pe.part} value={pe.part}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                    <span className="font-medium">{pe.part}</span>
                    {pe.score > 0 && (
                      <Badge
                        variant={pe.score >= 4 ? "default" : pe.score >= 3 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {pe.score}점
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Label className="w-16 shrink-0 text-sm">점수</Label>
                    <ScoreSelector
                      value={pe.score}
                      onChange={(v) => updatePartEval(idx, "score", v)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">잘한 점</Label>
                    <Textarea
                      value={pe.good}
                      onChange={(e) => updatePartEval(idx, "good", e.target.value)}
                      placeholder="이 파트에서 잘한 점을 작성해주세요."
                      rows={2}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">아쉬운 점</Label>
                    <Textarea
                      value={pe.bad}
                      onChange={(e) => updatePartEval(idx, "bad", e.target.value)}
                      placeholder="이 파트에서 아쉬운 점을 작성해주세요."
                      rows={2}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">점수 근거</Label>
                    <Textarea
                      value={pe.reason}
                      onChange={(e) => updatePartEval(idx, "reason", e.target.value)}
                      placeholder="위 점수를 준 이유를 설명해주세요."
                      rows={2}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">다음 프로젝트 개선안</Label>
                    <Textarea
                      value={pe.improvement}
                      onChange={(e) => updatePartEval(idx, "improvement", e.target.value)}
                      placeholder="다음 프로젝트에서 개선할 방법을 제안해주세요."
                      rows={2}
                      disabled={readOnly}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* 4. KPT */}
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

      {/* 5. SSC */}
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

      {/* 6. 종합 의견 */}
      <Card>
        <CardHeader>
          <CardTitle>종합 의견</CardTitle>
          <CardDescription>프로젝트 전체에 대한 의견을 작성해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>이번 프로젝트에서 가장 잘한 점</Label>
            <Textarea
              value={form.overall_best}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, overall_best: e.target.value }))
              }
              placeholder="팀이 가장 잘 해낸 부분을 작성해주세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>이번 프로젝트에서 가장 아쉬운 점</Label>
            <Textarea
              value={form.overall_worst}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, overall_worst: e.target.value }))
              }
              placeholder="가장 아쉬웠던 부분을 작성해주세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>다음 프로젝트에 반드시 개선할 사항</Label>
            <Textarea
              value={form.overall_improvement}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, overall_improvement: e.target.value }))
              }
              placeholder="반드시 개선해야 할 사항을 작성해주세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>팀원들에게 전하고 싶은 말</Label>
            <Textarea
              value={form.overall_message}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, overall_message: e.target.value }))
              }
              placeholder="팀원들에게 하고 싶은 말을 자유롭게 작성해주세요."
              rows={3}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* 7. 공유 메모 (기존) */}
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

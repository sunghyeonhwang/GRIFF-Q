"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Briefcase,
  CalendarDays,
  Palette,
  Wrench,
  Users,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createProjectWithTemplate } from "@/actions/project";
import {
  PROJECT_ROLE_TEMPLATES,
  PROJECT_TASK_TEMPLATES,
  type ProjectType,
  type ProjectRole,
} from "@/types/project.types";
import { ProjectMemberManager } from "./project-member-manager";

interface User {
  id: string;
  name: string;
}

interface ProjectCreateDialogProps {
  userId: string;
  users: User[];
}

const PROJECT_TYPE_CONFIG: Record<
  ProjectType,
  { label: string; description: string; icon: React.ElementType; color: string }
> = {
  general: {
    label: "일반 프로젝트",
    description: "기획 → 디자인 → 개발 → QA → 배포 흐름의 일반적인 프로젝트",
    icon: Briefcase,
    color: "text-blue-500",
  },
  event: {
    label: "행사/이벤트",
    description: "행사 기획, 홍보물 제작, 현장 운영 등 이벤트 중심 프로젝트",
    icon: CalendarDays,
    color: "text-purple-500",
  },
  content: {
    label: "콘텐츠 제작",
    description: "콘텐츠 기획, 제작, 편집, 발행 흐름의 콘텐츠 프로젝트",
    icon: Palette,
    color: "text-pink-500",
  },
  maintenance: {
    label: "유지보수",
    description: "이슈 분석, 수정, 테스트, 배포 위주의 유지보수 프로젝트",
    icon: Wrench,
    color: "text-orange-500",
  },
};

const ROLE_LABELS: Record<ProjectRole, string> = {
  pm: "PM",
  planner: "기획자",
  designer: "디자이너",
  developer: "개발자",
  video: "영상 담당",
  operations: "운영 담당",
  allrounder: "올라운더",
};

const STEPS = [
  { number: 1, label: "종류 선택" },
  { number: 2, label: "기본 정보" },
  { number: 3, label: "R&R 배정" },
  { number: 4, label: "확인" },
];

interface MemberAssignment {
  role: ProjectRole;
  user_id: string;
  is_backup: boolean;
}

export function ProjectCreateDialog({
  users,
}: ProjectCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1: 종류
  const [projectType, setProjectType] = useState<ProjectType>("general");

  // Step 2: 기본 정보
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  // Step 3: R&R
  const [members, setMembers] = useState<MemberAssignment[]>([]);

  // 종류 변경 시 기본 역할 로드
  function handleTypeChange(type: ProjectType) {
    setProjectType(type);
    const defaultRoles = PROJECT_ROLE_TEMPLATES[type];
    setMembers(
      defaultRoles.map((role) => ({
        role,
        user_id: "",
        is_backup: false,
      }))
    );
  }

  function resetForm() {
    setStep(1);
    setProjectType("general");
    setForm({ name: "", description: "", start_date: "", end_date: "" });
    setMembers([]);
  }

  function handleOpenChange(open: boolean) {
    setOpen(open);
    if (open) {
      // 다이얼로그 열 때 기본값 초기화
      handleTypeChange("general");
    } else {
      resetForm();
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return !!projectType;
      case 2:
        return !!form.name.trim();
      case 3:
        return true; // 멤버는 선택사항
      default:
        return true;
    }
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("프로젝트명을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const assignedMembers = members
        .filter((m) => m.user_id)
        .map((m) => ({ user_id: m.user_id, role: m.role }));

      const result = await createProjectWithTemplate({
        name: form.name,
        project_type: projectType,
        description: form.description || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        members: assignedMembers.length > 0 ? assignedMembers : undefined,
      });

      toast.success("프로젝트가 생성되었습니다.", {
        description: `${PROJECT_TASK_TEMPLATES[projectType].length}개의 임무카드가 자동 생성되었습니다.`,
      });

      setOpen(false);
      resetForm();
      router.refresh();
      router.push(`/projects/${result.project.id}`);
    } catch (error) {
      toast.error("프로젝트 생성 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          새 프로젝트
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 프로젝트 만들기</DialogTitle>
          <DialogDescription>
            {STEPS[step - 1].label} ({step}/4)
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center size-8 rounded-full text-sm font-medium transition-colors ${
                  step > s.number
                    ? "bg-primary text-primary-foreground"
                    : step === s.number
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.number ? (
                  <Check className="size-4" />
                ) : (
                  s.number
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    step > s.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          {/* Step 1: 종류 선택 */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                프로젝트 종류를 선택하면 기본 역할과 임무카드가 자동으로 구성됩니다.
              </p>
              <RadioGroup
                value={projectType}
                onValueChange={(v) => handleTypeChange(v as ProjectType)}
                className="grid gap-3"
              >
                {(Object.keys(PROJECT_TYPE_CONFIG) as ProjectType[]).map(
                  (type) => {
                    const config = PROJECT_TYPE_CONFIG[type];
                    const Icon = config.icon;
                    const roles = PROJECT_ROLE_TEMPLATES[type];
                    const tasks = PROJECT_TASK_TEMPLATES[type];
                    return (
                      <label
                        key={type}
                        className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                          projectType === type
                            ? "border-primary bg-accent"
                            : "border-border"
                        }`}
                      >
                        <RadioGroupItem value={type} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className={`size-5 ${config.color}`} />
                            <span className="font-medium">{config.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-xs text-muted-foreground mr-1">역할:</span>
                            {roles.map((role) => (
                              <Badge
                                key={role}
                                variant="secondary"
                                className="text-xs"
                              >
                                {ROLE_LABELS[role]}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs text-muted-foreground mr-1">
                              임무카드 ({tasks.length}개):
                            </span>
                            {tasks.map((t) => (
                              <Badge
                                key={t.title}
                                variant="outline"
                                className="text-xs"
                              >
                                {t.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </label>
                    );
                  }
                )}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: 기본 정보 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>프로젝트명 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="프로젝트명을 입력하세요"
                  autoFocus
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
            </div>
          )}

          {/* Step 3: R&R 배정 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>
                  {PROJECT_TYPE_CONFIG[projectType].label}의 기본 역할이
                  로드되었습니다. 각 역할에 팀원을 배정하세요.
                </span>
              </div>
              <ProjectMemberManager
                members={members}
                onChange={setMembers}
                users={users}
                projectType={projectType}
              />
            </div>
          )}

          {/* Step 4: 확인 (Summary) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm font-medium">
                  아래 내용으로 프로젝트를 생성합니다.
                </span>
              </div>

              {/* 종류 */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = PROJECT_TYPE_CONFIG[projectType];
                    const Icon = config.icon;
                    return (
                      <>
                        <Icon className={`size-5 ${config.color}`} />
                        <div>
                          <p className="text-xs text-muted-foreground">종류</p>
                          <p className="font-medium">{config.label}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">프로젝트명</p>
                  <p className="font-medium">{form.name}</p>
                </div>

                {form.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">설명</p>
                    <p className="text-sm">{form.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">시작일</p>
                    <p className="text-sm">
                      {form.start_date
                        ? new Date(form.start_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">종료일</p>
                    <p className="text-sm">
                      {form.end_date
                        ? new Date(form.end_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* R&R */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="size-4" />
                  <p className="text-sm font-medium">R&R 배정</p>
                </div>
                <div className="space-y-2">
                  {members.map((m, idx) => {
                    const assignedUser = users.find((u) => u.id === m.user_id);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {ROLE_LABELS[m.role]}
                          </Badge>
                          {m.is_backup && (
                            <Badge variant="outline" className="text-xs">
                              백업
                            </Badge>
                          )}
                        </div>
                        <span
                          className={
                            assignedUser
                              ? "font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {assignedUser ? assignedUser.name : "미배정"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 자동 생성 임무카드 */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="size-4" />
                  <p className="text-sm font-medium">
                    자동 생성 임무카드 ({PROJECT_TASK_TEMPLATES[projectType].length}개)
                  </p>
                </div>
                <div className="space-y-1">
                  {PROJECT_TASK_TEMPLATES[projectType].map((t) => (
                    <div
                      key={t.title}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{t.title}</span>
                      <Badge variant="outline" className="text-xs">
                        가중치 {t.weight}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 size-4" />
                이전
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              취소
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                다음
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <LoadingButton
                onClick={handleSubmit}
                loading={loading}
                loadingText="생성 중..."
              >
                <Sparkles className="mr-2 size-4" />
                프로젝트 생성
              </LoadingButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

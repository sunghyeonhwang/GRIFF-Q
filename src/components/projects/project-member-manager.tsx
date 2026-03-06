"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  PROJECT_ROLE_TEMPLATES,
  type ProjectType,
  type ProjectRole,
} from "@/types/project.types";

interface User {
  id: string;
  name: string;
}

interface MemberAssignment {
  role: ProjectRole;
  user_id: string;
  is_backup: boolean;
}

interface ProjectMemberManagerProps {
  members: MemberAssignment[];
  onChange: (members: MemberAssignment[]) => void;
  users: User[];
  projectType: ProjectType;
}

const ROLE_LABELS: Record<ProjectRole, string> = {
  pm: "PM",
  planner: "기획자",
  designer: "디자이너",
  developer: "개발자",
  video: "영상 담당",
  operations: "운영 담당",
  allrounder: "올라운더",
};

const ALL_ROLES: ProjectRole[] = [
  "pm",
  "planner",
  "designer",
  "developer",
  "video",
  "operations",
  "allrounder",
];

export function ProjectMemberManager({
  members,
  onChange,
  users,
  projectType,
}: ProjectMemberManagerProps) {
  function updateMember(index: number, updates: Partial<MemberAssignment>) {
    const updated = [...members];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  }

  function removeMember(index: number) {
    onChange(members.filter((_, i) => i !== index));
  }

  function addMember() {
    // 사용되지 않은 역할 중 첫 번째를 기본값으로
    const usedRoles = members.map((m) => m.role);
    const availableRole =
      ALL_ROLES.find((r) => !usedRoles.includes(r)) || "allrounder";
    onChange([
      ...members,
      { role: availableRole, user_id: "", is_backup: false },
    ]);
  }

  function resetToDefault() {
    const defaultRoles = PROJECT_ROLE_TEMPLATES[projectType];
    onChange(
      defaultRoles.map((role) => ({
        role,
        user_id: "",
        is_backup: false,
      }))
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">역할 목록 ({members.length})</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
          >
            초기화
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMember}
          >
            <Plus className="mr-1 size-3" />
            역할 추가
          </Button>
        </div>
      </div>

      {/* Member Rows */}
      <div className="space-y-2">
        {members.map((member, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            {/* 역할 선택 */}
            <div className="w-[130px] shrink-0">
              <Select
                value={member.role}
                onValueChange={(v) =>
                  updateMember(idx, { role: v as ProjectRole })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 팀원 배정 */}
            <div className="flex-1">
              <Select
                value={member.user_id || "unassigned"}
                onValueChange={(v) =>
                  updateMember(idx, {
                    user_id: v === "unassigned" ? "" : v,
                  })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="팀원 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">미배정</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 백업 토글 */}
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                id={`backup-${idx}`}
                checked={member.is_backup}
                onCheckedChange={(checked) =>
                  updateMember(idx, { is_backup: checked })
                }
              />
              <Label
                htmlFor={`backup-${idx}`}
                className="text-xs text-muted-foreground cursor-pointer"
              >
                백업
              </Label>
            </div>

            {/* 삭제 */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeMember(idx)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          역할이 없습니다. &quot;역할 추가&quot; 또는 &quot;초기화&quot;를
          클릭하세요.
        </div>
      )}

      {/* 미배정 경고 */}
      {members.some((m) => !m.user_id) && members.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          미배정 역할이 있습니다. 프로젝트 생성 후에도 배정할 수 있습니다.
        </p>
      )}
    </div>
  );
}

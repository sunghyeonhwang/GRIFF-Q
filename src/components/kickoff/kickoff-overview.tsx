"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X } from "lucide-react";
import { updateKickoff } from "@/actions/kickoff";
import { toast } from "sonner";
import type { ProjectKickoff } from "@/types/kickoff.types";

interface KickoffOverviewProps {
  kickoff: ProjectKickoff;
  projectId: string;
  canEdit: boolean;
}

const FIELDS = [
  { key: "objective" as const, label: "프로젝트 목표", placeholder: "이 프로젝트의 목표를 작성해주세요..." },
  { key: "scope" as const, label: "작업 범위", placeholder: "작업 범위를 정의해주세요..." },
  { key: "constraints" as const, label: "제약 조건", placeholder: "제약 조건이 있다면 작성해주세요..." },
  { key: "success_criteria" as const, label: "성공 기준", placeholder: "성공 기준을 정의해주세요..." },
];

export function KickoffOverview({ kickoff, projectId, canEdit }: KickoffOverviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function startEdit(key: string, currentValue: string | null) {
    setEditingField(key);
    setEditValue(currentValue ?? "");
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  function saveField(key: string) {
    startTransition(async () => {
      try {
        await updateKickoff(kickoff.id, { [key]: editValue });
        toast.success("저장되었습니다.");
        setEditingField(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  const isCompleted = kickoff.status === "completed";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {FIELDS.map((field) => (
        <Card key={field.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
            {canEdit && !isCompleted && editingField !== field.key && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => startEdit(field.key, kickoff[field.key])}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingField === field.key ? (
              <div className="space-y-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isPending}>
                    <X className="size-3.5 mr-1" /> 취소
                  </Button>
                  <Button size="sm" onClick={() => saveField(field.key)} disabled={isPending}>
                    <Save className="size-3.5 mr-1" /> 저장
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {kickoff[field.key] || field.placeholder}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

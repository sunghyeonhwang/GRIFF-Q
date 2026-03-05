"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ProjectKickoff } from "@/lib/kickoff-constants";

interface KickoffOverviewProps {
  kickoff: ProjectKickoff;
  isPM: boolean;
  onUpdate: (updates: Partial<ProjectKickoff>) => Promise<void>;
}

interface FieldConfig {
  key: keyof Pick<ProjectKickoff, "objective" | "scope" | "constraints" | "success_criteria" | "kickoff_date">;
  label: string;
  multiline: boolean;
  type?: string;
}

const FIELDS: FieldConfig[] = [
  { key: "objective", label: "목표", multiline: true },
  { key: "scope", label: "작업 범위", multiline: true },
  { key: "constraints", label: "제약 조건", multiline: true },
  { key: "success_criteria", label: "성공 기준", multiline: true },
  { key: "kickoff_date", label: "킥오프 일자", multiline: false, type: "date" },
];

export function KickoffOverview({ kickoff, isPM, onUpdate }: KickoffOverviewProps) {
  const { status } = kickoff;
  const isCompleted = status === "completed";
  const isDraft = status === "draft";

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로젝트 개요</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {FIELDS.map((f) => (
          <OverviewField
            key={f.key}
            config={f}
            value={(kickoff[f.key] as string) ?? ""}
            editable={!isCompleted && isPM}
            alwaysEdit={isDraft && isPM}
            onSave={(val) => onUpdate({ [f.key]: val })}
          />
        ))}
      </CardContent>
    </Card>
  );
}

/* --- Inline-editable field --- */

interface OverviewFieldProps {
  config: FieldConfig;
  value: string;
  editable: boolean;
  alwaysEdit: boolean;
  onSave: (value: string) => Promise<void>;
}

function OverviewField({ config, value, editable, alwaysEdit, onSave }: OverviewFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const save = useCallback(
    async (val: string) => {
      if (val === value) return;
      try {
        await onSave(val);
      } catch {
        toast.error("저장 실패");
        setLocalValue(value);
      }
    },
    [value, onSave]
  );

  const handleChange = (val: string) => {
    setLocalValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(val), 800);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(localValue);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      save(localValue);
    }
  };

  const showInput = alwaysEdit || editing;

  if (!editable) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{config.label}</Label>
        <p className="text-sm whitespace-pre-wrap">{value || "-"}</p>
      </div>
    );
  }

  if (!showInput) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{config.label}</Label>
        <div
          className="cursor-pointer rounded-md border border-transparent px-3 py-2 text-sm hover:border-border whitespace-pre-wrap min-h-[2rem]"
          onClick={() => setEditing(true)}
        >
          {value || <span className="text-muted-foreground">클릭하여 입력</span>}
        </div>
      </div>
    );
  }

  if (config.type === "date") {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{config.label}</Label>
        <Input
          type="date"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus={!alwaysEdit}
        />
      </div>
    );
  }

  if (config.multiline) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{config.label}</Label>
        <Textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={3}
          autoFocus={!alwaysEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{config.label}</Label>
      <Input
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus={!alwaysEdit}
      />
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ProjectKickoff } from "@/lib/kickoff-constants";

interface KickoffNotesProps {
  kickoff: ProjectKickoff;
  isPM: boolean;
  onUpdate: (notes: string) => Promise<void>;
}

export function KickoffNotes({ kickoff, isPM, onUpdate }: KickoffNotesProps) {
  const [localValue, setLocalValue] = useState(kickoff.notes ?? "");
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isCompleted = kickoff.status === "completed";
  const editable = !isCompleted && isPM;

  useEffect(() => {
    setLocalValue(kickoff.notes ?? "");
  }, [kickoff.notes]);

  const save = useCallback(
    async (val: string) => {
      if (val === (kickoff.notes ?? "")) return;
      try {
        await onUpdate(val);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        toast.error("메모 저장 실패");
      }
    },
    [kickoff.notes, onUpdate]
  );

  const handleChange = (val: string) => {
    setLocalValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(val), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>메모</CardTitle>
          {saved && (
            <span className="text-xs text-muted-foreground animate-in fade-in">
              저장됨
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editable ? (
          <Textarea
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="킥오프 관련 메모를 작성하세요"
            rows={4}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">
            {kickoff.notes || <span className="text-muted-foreground">메모 없음</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

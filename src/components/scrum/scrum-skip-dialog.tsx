"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SKIP_REASONS } from "@/types/scrum.types";
import { skipScrum } from "@/actions/scrum";
import { toast } from "sonner";

interface ScrumSkipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scrumId: string;
  onSkipped: () => void;
}

export function ScrumSkipDialog({
  open,
  onOpenChange,
  scrumId,
  onSkipped,
}: ScrumSkipDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkip = async () => {
    const finalReason = reason === "기타" ? customReason.trim() || "기타" : reason;
    if (!finalReason) {
      toast.error("사유를 선택해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      await skipScrum(scrumId, finalReason);
      onSkipped();
      onOpenChange(false);
    } catch {
      toast.error("건너뛰기 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>오늘 스크럼 건너뛰기</DialogTitle>
          <DialogDescription>
            사유를 선택하면 오늘의 스크럼을 건너뜁니다.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
          {SKIP_REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem value={r} id={`skip-${r}`} />
              <Label htmlFor={`skip-${r}`}>{r}</Label>
            </div>
          ))}
        </RadioGroup>

        {reason === "기타" && (
          <Input
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="사유를 입력하세요"
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSkip}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "건너뛰기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

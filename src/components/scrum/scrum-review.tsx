"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Moon, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { ScrumItem } from "@/types/scrum.types";
import { reviewDay } from "@/actions/scrum";

interface ScrumReviewProps {
  scrumId: string;
  items: ScrumItem[];
  onClose: () => void;
}

export function ScrumReview({ scrumId, items, onClose }: ScrumReviewProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(items.filter((i) => i.status === "completed").map((i) => i.id))
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const completedCount = completedIds.size;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const notesSummary = Object.entries(notes)
        .filter(([, v]) => v.trim())
        .map(([id, v]) => {
          const item = items.find((i) => i.id === id);
          return `${item?.title}: ${v}`;
        })
        .join("\n");
      await reviewDay(scrumId, Array.from(completedIds), notesSummary || undefined);
      toast.success("하루 마감 완료!");
      onClose();
      window.location.reload();
    } catch {
      toast.error("마감 처리 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          하루 마감 회고
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          오늘 완료한 항목을 체크하세요. 미완료 항목은 내일 이월 대상이 됩니다.
        </p>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="space-y-1">
              <label className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={completedIds.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                />
                <span className="text-sm flex-1">{item.title}</span>
                {completedIds.has(item.id) ? (
                  <Badge variant="default" className="text-xs">완료</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">미완료</Badge>
                )}
              </label>
              {!completedIds.has(item.id) && (
                <Input
                  value={notes[item.id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  placeholder="미완료 사유 (선택)"
                  className="ml-8 h-7 text-xs"
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          달성률: {percentage}% ({completedCount}/{totalCount})
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <CheckCircle className="h-4 w-4 mr-1" />
            {isSubmitting ? "처리 중..." : "마감 완료"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

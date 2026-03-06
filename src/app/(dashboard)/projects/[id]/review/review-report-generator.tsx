"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ReviewReportGeneratorProps {
  projectId: string;
}

export function ReviewReportGenerator({ projectId }: ReviewReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/review/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "on_demand" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "보고서 생성 실패");
      }

      toast.success("AI 보고서가 생성되었습니다.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류 발생";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium">AI 프로젝트 보고서</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            프로젝트 데이터를 분석하여 진행률, 리스크, 추천 사항을 생성합니다.
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="mr-1.5 size-3.5" />
              보고서 생성
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

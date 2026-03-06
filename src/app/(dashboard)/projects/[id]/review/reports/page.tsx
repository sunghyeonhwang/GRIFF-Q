"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ProjectReview } from "@/types/review.types";

export default function ReviewReportsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    const supabase = createClient();

    const [projectRes, reviewsRes] = await Promise.all([
      supabase.from("projects").select("name").eq("id", projectId).single(),
      supabase
        .from("project_reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

    setProjectName(projectRes.data?.name ?? "");
    setReviews((reviewsRes.data as ProjectReview[]) ?? []);
    setLoading(false);
  }

  async function generateReport(type: "weekly" | "monthly") {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/review/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "보고서 생성에 실패했습니다.");
        return;
      }

      const review = await res.json();
      setReviews((prev) => [review, ...prev]);
      toast.success(`${type === "weekly" ? "주간" : "월간"} 보고서가 생성되었습니다.`);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}/review`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">AI 보고서</h1>
            <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => generateReport("weekly")}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            주간 보고서
          </Button>
          <Button
            onClick={() => generateReport("monthly")}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            월간 보고서
          </Button>
        </div>
      </div>

      {/* Report List */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <Link
              key={review.id}
              href={`/projects/${projectId}/review/reports/${review.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{review.review_type === "weekly" ? "주간" : review.review_type === "monthly" ? "월간" : "수시"} 보고서</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {new Date(review.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {review.summary ?? "요약 없음"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="size-12 mb-4" />
            <p className="text-lg font-medium">보고서가 없습니다</p>
            <p className="text-sm mt-1">
              위 버튼을 클릭하여 AI 보고서를 생성하세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

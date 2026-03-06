import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReviewReportCard } from "@/components/project-review/review-report-card";
import type { ProjectReview } from "@/types/review.types";

export default async function ReviewReportDetailPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  await requireAuth();
  const { id: projectId, reportId } = await params;
  const supabase = await createClient();

  const [projectRes, reviewRes] = await Promise.all([
    supabase.from("projects").select("name").eq("id", projectId).single(),
    supabase
      .from("project_reviews")
      .select("*")
      .eq("id", reportId)
      .eq("project_id", projectId)
      .single(),
  ]);

  if (!projectRes.data || !reviewRes.data) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${projectId}/review`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">AI 보고서 상세</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projectRes.data.name}
          </p>
        </div>
      </div>

      <ReviewReportCard review={reviewRes.data as ProjectReview} />
    </div>
  );
}

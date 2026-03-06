import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, FileText } from "lucide-react";
import { ReviewChat } from "@/components/project-review/review-chat";
import { ReviewReportCard } from "@/components/project-review/review-report-card";
import { ReviewReportGenerator } from "./review-report-generator";
import type { ProjectReview } from "@/types/review.types";

export default async function ProjectReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // 최근 보고서 로드
  const { data: reviews } = await supabase
    .from("project_reviews")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const latestReview = reviews?.[0] as ProjectReview | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">AI 리뷰</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project.name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat" className="flex items-center gap-1.5">
            <MessageSquare className="size-3.5" />
            AI 대화
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-1.5">
            <FileText className="size-3.5" />
            보고서
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <ReviewChat projectId={id} />
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <ReviewReportGenerator projectId={id} />
          {latestReview && <ReviewReportCard review={latestReview} />}
          {!latestReview && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              생성된 보고서가 없습니다. 위 버튼을 눌러 AI 보고서를 생성하세요.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

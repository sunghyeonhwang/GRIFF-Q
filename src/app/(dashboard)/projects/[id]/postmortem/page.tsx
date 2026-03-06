import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PostmortemForm } from "@/components/projects/postmortem-form";

const SEVERITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const SEVERITY_BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  critical: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  open: "미완료",
  in_progress: "진행중",
  done: "완료",
};

interface TimelineEntry {
  date?: string;
  time: string;
  title?: string;
  description: string;
  root_cause?: string;
  lessons?: string[];
  actions?: {
    title: string;
    assignee: string;
    due_date: string;
    status: string;
  }[];
}

export default async function PostmortemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: postmortem } = await supabase
    .from("postmortems")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no postmortem, show creation form
  if (!postmortem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Post-mortem 작성</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.name}
            </p>
          </div>
        </div>
        <PostmortemForm projectId={id} userId={user.id} />
      </div>
    );
  }

  // View mode
  const timeline = (postmortem.timeline as TimelineEntry[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Post-mortem</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.name}
            </p>
          </div>
        </div>
        <Badge variant={SEVERITY_BADGE_VARIANTS[postmortem.severity] ?? "outline"}>
          {SEVERITY_LABELS[postmortem.severity] ?? postmortem.severity}
        </Badge>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>{postmortem.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">발생일</dt>
              <dd className="font-medium mt-1">
                {new Date(postmortem.incident_date).toLocaleDateString("ko-KR")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">심각도</dt>
              <dd className="mt-1">
                <Badge
                  variant={
                    SEVERITY_BADGE_VARIANTS[postmortem.severity] ?? "outline"
                  }
                >
                  {SEVERITY_LABELS[postmortem.severity] ?? postmortem.severity}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 타임라인 회고 */}
      {timeline.length > 0 && (
        <div className="space-y-4">
          {timeline.map((entry, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {entry.title || entry.description}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.date &&
                        new Date(entry.date).toLocaleDateString("ko-KR")}
                      {entry.date && entry.time && " "}
                      {entry.time}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* 설명 */}
                {entry.description && entry.title && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      설명
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {entry.description}
                    </p>
                  </div>
                )}

                {/* 근본 원인 */}
                {entry.root_cause && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                      근본 원인
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {entry.root_cause}
                    </p>
                  </div>
                )}

                {/* 교훈 */}
                {entry.lessons && entry.lessons.length > 0 && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                      교훈
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {entry.lessons.map((lesson, li) => (
                        <li key={li} className="text-sm">
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 액션 아이템 */}
                {entry.actions && entry.actions.length > 0 && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                      액션 아이템
                    </p>
                    <div className="space-y-2">
                      {entry.actions.map((action, ai) => (
                        <div
                          key={ai}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <p className="font-medium">{action.title}</p>
                            <p className="text-xs text-muted-foreground">
                              담당: {action.assignee || "-"}
                              {action.due_date &&
                                ` / 기한: ${new Date(action.due_date).toLocaleDateString("ko-KR")}`}
                            </p>
                          </div>
                          <Badge
                            variant={
                              action.status === "done"
                                ? "default"
                                : action.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {STATUS_LABELS[action.status] ?? action.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

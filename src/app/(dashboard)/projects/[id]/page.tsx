import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, AlertTriangle, GitBranch } from "lucide-react";
import { ProjectHubTabs } from "@/components/projects/project-hub-tabs";
import { ProjectProgressBar } from "@/components/projects/project-progress-bar";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, users!projects_lead_user_id_fkey(name)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const [
    estimatesRes,
    meetingsRes,
    retrospectivesRes,
    paymentsRes,
    membersRes,
    milestonesRes,
    taskCountRes,
  ] = await Promise.all([
    supabase
      .from("estimates")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("meetings")
      .select("*, users!meetings_created_by_fkey(name)")
      .eq("project_id", id)
      .order("meeting_date", { ascending: false }),
    supabase
      .from("retrospectives")
      .select("*, users!retrospectives_created_by_fkey(name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_members")
      .select("*, users!project_members_user_id_fkey(name, email)")
      .eq("project_id", id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
  ]);

  // 멤버 데이터에 user 정보 매핑
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (membersRes.data ?? []).map((m: any) => ({
    ...m,
    user: m.users
      ? { name: m.users.name, email: m.users.email }
      : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              프로젝트 허브
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${id}/dependency-map`}>
            <Button variant="outline">
              <GitBranch className="mr-2 size-4" />
              의존성 맵
            </Button>
          </Link>
          <Link href={`/projects/${id}/review`}>
            <Button variant="outline">
              <ClipboardCheck className="mr-2 size-4" />
              리뷰
            </Button>
          </Link>
          <Link href={`/projects/${id}/postmortem`}>
            <Button variant="outline">
              <AlertTriangle className="mr-2 size-4" />
              Post-mortem
            </Button>
          </Link>
        </div>
      </div>

      {/* 진행률 바 (헤더 아래) */}
      {typeof project.progress === "number" && project.progress > 0 && (
        <ProjectProgressBar progress={project.progress} className="max-w-md" />
      )}

      {/* Tabs */}
      <ProjectHubTabs
        project={{
          id: project.id,
          name: project.name,
          status: project.status ?? "active",
          project_type: project.project_type ?? undefined,
          progress: project.progress ?? 0,
          start_date: project.start_date,
          end_date: project.end_date,
          description: project.description ?? "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lead_user_name: (project as any).users?.name ?? null,
        }}
        estimates={estimatesRes.data ?? []}
        meetings={meetingsRes.data ?? []}
        retrospectives={retrospectivesRes.data ?? []}
        payments={paymentsRes.data ?? []}
        members={members}
        milestones={milestonesRes.data ?? []}
        taskCount={taskCountRes.count ?? 0}
      />
    </div>
  );
}

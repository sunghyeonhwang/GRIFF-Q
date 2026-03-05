import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, AlertTriangle, Rocket, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjectHubTabs } from "@/components/projects/project-hub-tabs";
import { ProjectEditDialog } from "@/components/projects/project-edit-dialog";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, users!projects_lead_user_id_fkey(name)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Fetch kickoff status for warning banner
  const { data: kickoff } = await supabase
    .from("project_kickoffs")
    .select("id, status")
    .eq("project_id", id)
    .single();

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*, users!meetings_created_by_fkey(name)")
    .eq("project_id", id)
    .order("meeting_date", { ascending: false });

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
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <ProjectEditDialog
                project={{
                  id: project.id,
                  name: project.name,
                  status: project.status ?? "active",
                  lead_user_id: project.lead_user_id,
                  start_date: project.start_date,
                  end_date: project.end_date,
                  description: project.description,
                }}
                users={allUsers ?? []}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              프로젝트 허브
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${id}/kickoff`}>
            <Button variant="outline">
              <Rocket className="mr-2 size-4" />
              킥오프
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

      {/* Kickoff warning banner */}
      {(!kickoff || kickoff.status !== "completed") && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-50 px-4 py-3 dark:bg-yellow-950/20">
          <Rocket className="size-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
            {!kickoff
              ? "킥오프가 아직 설정되지 않았습니다."
              : "킥오프가 완료되지 않았습니다."}
          </p>
          <Link href={`/projects/${id}/kickoff`}>
            <Badge variant="outline" className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
              킥오프 진행하기
            </Badge>
          </Link>
        </div>
      )}

      {/* Tabs */}
      <ProjectHubTabs
        project={{
          id: project.id,
          name: project.name,
          status: project.status ?? "active",
          start_date: project.start_date,
          end_date: project.end_date,
          description: project.description ?? "",
          lead_user_name: (project as any).users?.name ?? null,
        }}
        meetings={meetings ?? []}
      />
    </div>
  );
}

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { KickoffProgress } from "@/components/kickoff/kickoff-progress";
import { KickoffOverview } from "@/components/kickoff/kickoff-overview";
import { KickoffTeam } from "@/components/kickoff/kickoff-team";
import { KickoffMilestones } from "@/components/kickoff/kickoff-milestones";
import { KickoffChecklist } from "@/components/kickoff/kickoff-checklist";
import { KickoffMeetingNotes } from "@/components/kickoff/kickoff-meeting-notes";
import { KickoffCompleteButton } from "@/components/kickoff/kickoff-complete-button";
import { createKickoff } from "@/actions/kickoff";
import { notFound, redirect } from "next/navigation";
import type { ProjectKickoff, KickoffChecklistItem } from "@/types/kickoff.types";
import type { ProjectMember, ProjectMilestone } from "@/types/project.types";

export default async function ProjectKickoffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { id: projectId } = await params;

  // 1. 프로젝트 조회
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, project_type")
    .eq("id", projectId)
    .single();

  if (projectError || !project) notFound();

  // 2. project_type 체크 — "general" 타입만 킥오프 지원
  // (general = 일반 프로젝트, 기획서에서 "프로젝트" 유형)
  if (project.project_type && !["general"].includes(project.project_type)) {
    redirect(`/projects/${projectId}`);
  }

  // 3. 킥오프 조회 (없으면 자동 생성)
  let kickoff: ProjectKickoff;
  const { data: existingKickoff } = await supabase
    .from("project_kickoffs")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (existingKickoff) {
    kickoff = existingKickoff as ProjectKickoff;
  } else {
    kickoff = await createKickoff(projectId);
  }

  // 4. 체크리스트 조회 (assignee join)
  const { data: checklistData } = await supabase
    .from("kickoff_checklist_items")
    .select("*, assignee:users!kickoff_checklist_items_assignee_id_fkey(name)")
    .eq("kickoff_id", kickoff.id)
    .order("sort_order", { ascending: true });

  const checklistItems = (checklistData ?? []) as KickoffChecklistItem[];

  // 5. 프로젝트 멤버 조회
  const { data: membersData } = await supabase
    .from("project_members")
    .select("*, user:users!project_members_user_id_fkey(name, email)")
    .eq("project_id", projectId);

  const members = (membersData ?? []) as ProjectMember[];

  // 6. 마일스톤 조회
  const { data: milestonesData } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("target_date", { ascending: true });

  const milestones = (milestonesData ?? []) as ProjectMilestone[];

  // 7. 사용자 목록 (체크리스트 담당자 선택용)
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const users = (allUsers ?? []).map((u) => ({ id: u.id, name: u.name ?? "" }));

  // 8. 권한 계산
  const canEdit = kickoff.status !== "completed";
  const completedCount = checklistItems.filter((i) => i.is_completed).length;
  const allCompleted = checklistItems.length > 0 && completedCount === checklistItems.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.name} — 킥오프`}
        description="프로젝트 킥오프 체크리스트와 미팅 기록을 관리합니다."
      />

      {/* 진행률 */}
      <KickoffProgress
        total={checklistItems.length}
        completed={completedCount}
        status={kickoff.status}
      />

      {/* 프로젝트 개요 + 팀 구성 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <KickoffOverview kickoff={kickoff} projectId={projectId} canEdit={canEdit} />
        </div>
        <div>
          <KickoffTeam members={members} projectId={projectId} />
        </div>
      </div>

      {/* 마일스톤 */}
      <KickoffMilestones milestones={milestones} projectId={projectId} />

      {/* 체크리스트 + 미팅 기록 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <KickoffChecklist
          kickoffId={kickoff.id}
          items={checklistItems}
          canEdit={canEdit}
          users={users}
        />
        <KickoffMeetingNotes
          kickoff={kickoff}
          projectId={projectId}
          users={users}
          canEdit={canEdit}
        />
      </div>

      {/* 킥오프 완료 버튼 */}
      <KickoffCompleteButton
        kickoffId={kickoff.id}
        allCompleted={allCompleted}
        status={kickoff.status}
        projectId={projectId}
      />
    </div>
  );
}

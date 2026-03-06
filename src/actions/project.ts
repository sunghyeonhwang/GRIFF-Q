"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyProjectStatusChanged } from "@/lib/notifications";
import type {
  Project,
  ProjectType,
  ProjectRole,
  ProjectMember,
  ProjectMilestone,
} from "@/types/project.types";
import { PROJECT_TASK_TEMPLATES as TASK_TEMPLATES } from "@/types/project.types";
import type { Task } from "@/types/task.types";

// ─────────────────────────────────────────────
// 프로젝트 생성 (리워크 — 종류별 R&R + 임무카드 자동 생성)
// ─────────────────────────────────────────────

export async function createProjectWithTemplate(data: {
  name: string;
  project_type: ProjectType;
  description?: string;
  start_date?: string;
  end_date?: string;
  color?: string;
  priority?: number;
  members?: { user_id: string; role: ProjectRole }[];
}): Promise<{ project: Project; tasks: Task[]; members: ProjectMember[] }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 1. 프로젝트 생성 (기본 컬럼만 INSERT 후 확장 컬럼 UPDATE)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: data.name,
      title: data.name,
      description: data.description || "",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      lead_user_id: user.id,
      created_by: user.id,
    })
    .select()
    .single();

  if (projectError) throw new Error(`프로젝트 생성 실패: ${projectError.message}`);

  // 1-b. 확장 컬럼 UPDATE (v0.3A 신규 컬럼)
  const extendedFields: Record<string, unknown> = {};
  if (data.project_type) extendedFields.project_type = data.project_type;
  if (data.color) extendedFields.color = data.color;
  if (data.priority) extendedFields.priority = data.priority;

  if (Object.keys(extendedFields).length > 0) {
    await supabase.from("projects").update(extendedFields).eq("id", project.id);
  }

  // 2. 멤버 등록
  const memberInserts = (data.members || []).map((m) => ({
    project_id: project.id,
    user_id: m.user_id,
    role: m.role,
  }));

  let members: ProjectMember[] = [];
  if (memberInserts.length > 0) {
    const { data: membersData, error: membersError } = await supabase
      .from("project_members")
      .insert(memberInserts)
      .select();

    if (membersError) throw new Error(`멤버 등록 실패: ${membersError.message}`);
    members = membersData as ProjectMember[];
  }

  // 3. 임무카드 템플릿 자동 생성
  const taskTemplates = TASK_TEMPLATES[data.project_type];
  const taskInserts = taskTemplates.map((t, idx) => ({
    project_id: project.id,
    title: t.title,
    weight: t.weight,
    sort_order: idx,
    source: "template" as const,
    created_by: user.id,
  }));

  let tasks: Task[] = [];
  if (taskInserts.length > 0) {
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .insert(taskInserts)
      .select();

    if (tasksError) throw new Error(`임무카드 생성 실패: ${tasksError.message}`);
    tasks = tasksData as Task[];
  }

  // 4. 킥오프 자동 생성 (general 프로젝트)
  if (!data.project_type || data.project_type === "general") {
    const { createKickoff } = await import("@/actions/kickoff");
    await createKickoff(project.id);
  }

  revalidatePath("/projects");
  return { project: project as Project, tasks, members };
}

// ─────────────────────────────────────────────
// 프로젝트 업데이트
// ─────────────────────────────────────────────

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, "name" | "status" | "project_type" | "priority" | "color" | "archived" | "description" | "start_date" | "end_date" | "lead_user_id">>
): Promise<Project> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 변경 전 프로젝트 정보 조회 (알림 비교용)
  const { data: prevProject } = await supabase
    .from("projects")
    .select("status, name")
    .eq("id", id)
    .single();

  const { data: project, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`프로젝트 업데이트 실패: ${error.message}`);

  // 상태 변경 알림
  if (data.status && prevProject && data.status !== prevProject.status) {
    notifyProjectStatusChanged(
      supabase,
      id,
      prevProject.name ?? project.name,
      data.status
    ).catch(() => {});
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return project as Project;
}

// ─────────────────────────────────────────────
// 프로젝트 멤버 관리
// ─────────────────────────────────────────────

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const { data: member, error } = await supabase
    .from("project_members")
    .insert({
      project_id: projectId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw new Error(`멤버 추가 실패: ${error.message}`);

  revalidatePath(`/projects/${projectId}`);
  return member as ProjectMember;
}

export async function updateProjectMemberRole(
  memberId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const { data: member, error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw new Error(`멤버 역할 변경 실패: ${error.message}`);

  revalidatePath(`/projects/${member.project_id}`);
  revalidatePath(`/projects/${member.project_id}/settings`);
  return member as ProjectMember;
}

export async function removeProjectMember(memberId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 멤버 정보를 먼저 조회하여 projectId 확보
  const { data: member, error: fetchError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("id", memberId)
    .single();

  if (fetchError) throw new Error(`멤버 조회 실패: ${fetchError.message}`);

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId);

  if (error) throw new Error(`멤버 삭제 실패: ${error.message}`);

  revalidatePath(`/projects/${member.project_id}`);
}

export async function archiveProject(id: string): Promise<Project> {
  return updateProject(id, { archived: true });
}

// ─────────────────────────────────────────────
// 프로젝트 완료 (회고 유도 포함)
// ─────────────────────────────────────────────

export async function completeProject(projectId: string): Promise<{
  success: boolean;
  suggestRetrospective?: boolean;
  projectType?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "인증 필요" };

  // Get project type
  const { data: project } = await supabase
    .from("projects")
    .select("type, name")
    .eq("id", projectId)
    .single();

  if (!project) return { success: false, error: "프로젝트를 찾을 수 없습니다" };

  // Update status
  const { error } = await supabase
    .from("projects")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return {
    success: true,
    suggestRetrospective:
      project.type === "project" || project.type === "mini",
    projectType: project.type,
  };
}

// ─────────────────────────────────────────────
// 소프트 삭제 / 복원
// ─────────────────────────────────────────────

export async function softDeleteProject(projectId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 현재 사용자 프로필 조회
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("사용자 정보를 찾을 수 없습니다.");

  const isSuperOrBoss =
    profile.role === "super" || profile.role === "boss";

  if (!isSuperOrBoss) {
    // manager 이하는 자신이 생성한 프로젝트만 삭제 가능
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("created_by")
      .eq("id", projectId)
      .single();

    if (projectError) throw new Error(`프로젝트 조회 실패: ${projectError.message}`);

    const isManagerOrAbove = profile.role === "manager";
    const isOwner = project.created_by === user.id;

    if (!isManagerOrAbove || !isOwner) {
      throw new Error("권한이 부족합니다. 본인이 생성한 프로젝트만 삭제할 수 있습니다.");
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", projectId);

  if (error) throw new Error(`프로젝트 삭제 실패: ${error.message}`);

  revalidatePath("/projects");
}

export async function restoreProject(projectId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 복원은 super 전용
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super") {
    throw new Error("권한이 부족합니다. 슈퍼 관리자만 복원할 수 있습니다.");
  }

  const { error } = await supabase
    .from("projects")
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq("id", projectId);

  if (error) throw new Error(`프로젝트 복원 실패: ${error.message}`);

  revalidatePath("/projects");
}

// ─────────────────────────────────────────────
// 마일스톤 관리
// ─────────────────────────────────────────────

export async function createMilestone(
  projectId: string,
  data: { title: string; due_date?: string }
): Promise<ProjectMilestone> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // sort_order 자동 계산
  const { count } = await supabase
    .from("project_milestones")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { data: milestone, error } = await supabase
    .from("project_milestones")
    .insert({
      project_id: projectId,
      title: data.title,
      due_date: data.due_date || null,
      sort_order: count || 0,
    })
    .select()
    .single();

  if (error) throw new Error(`마일스톤 생성 실패: ${error.message}`);

  revalidatePath(`/projects/${projectId}`);
  return milestone as ProjectMilestone;
}

export async function updateMilestone(
  id: string,
  data: Partial<Pick<ProjectMilestone, "title" | "due_date" | "status" | "sort_order">>
): Promise<ProjectMilestone> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const { data: milestone, error } = await supabase
    .from("project_milestones")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`마일스톤 업데이트 실패: ${error.message}`);

  revalidatePath(`/projects/${milestone.project_id}`);
  return milestone as ProjectMilestone;
}

export async function deleteMilestone(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 마일스톤 정보를 먼저 조회
  const { data: milestone, error: fetchError } = await supabase
    .from("project_milestones")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(`마일스톤 조회 실패: ${fetchError.message}`);

  const { error } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`마일스톤 삭제 실패: ${error.message}`);

  revalidatePath(`/projects/${milestone.project_id}`);
}

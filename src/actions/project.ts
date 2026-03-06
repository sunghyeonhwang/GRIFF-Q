"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  // 1. 프로젝트 생성
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: data.name,
      project_type: data.project_type,
      description: data.description || "",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      color: data.color || "#3B82F6",
      priority: data.priority || 3,
      lead_user_id: user.id,
    })
    .select()
    .single();

  if (projectError) throw new Error(`프로젝트 생성 실패: ${projectError.message}`);

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

  const { data: project, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`프로젝트 업데이트 실패: ${error.message}`);

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

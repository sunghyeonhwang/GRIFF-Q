"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ProjectKickoff,
  KickoffChecklistItem,
  MeetingDecision,
} from "@/types/kickoff.types";

const DEFAULT_CHECKLIST_ITEMS = [
  { title: "프로젝트 목표 확정", description: "프로젝트 목표와 기대 효과를 명확히 정의합니다." },
  { title: "팀원 배정 완료", description: "역할별 담당자를 배정하고 R&R을 확인합니다." },
  { title: "마일스톤 설정 완료", description: "주요 일정과 마일스톤을 설정합니다." },
  { title: "레퍼런스/자료 수집", description: "필요한 레퍼런스와 자료를 수집합니다." },
  { title: "위험 요소 식별", description: "잠재적 리스크와 대응 방안을 정리합니다." },
];

// ─────────────────────────────────────────────
// Kickoff CRUD
// ─────────────────────────────────────────────

export async function createKickoff(projectId: string): Promise<ProjectKickoff> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 이미 존재하는지 확인
  const { data: existing } = await supabase
    .from("project_kickoffs")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (existing) return existing as ProjectKickoff;

  const { data: kickoff, error } = await supabase
    .from("project_kickoffs")
    .insert({ project_id: projectId })
    .select()
    .single();

  if (error) throw new Error(`킥오프 생성 실패: ${error.message}`);

  // 기본 체크리스트 삽입
  const checklistItems = DEFAULT_CHECKLIST_ITEMS.map((item, idx) => ({
    kickoff_id: kickoff.id,
    title: item.title,
    description: item.description,
    sort_order: idx,
  }));

  await supabase.from("kickoff_checklist_items").insert(checklistItems);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/kickoff`);
  return kickoff as ProjectKickoff;
}

export async function updateKickoff(
  id: string,
  data: {
    objective?: string;
    scope?: string;
    constraints?: string;
    success_criteria?: string;
    kickoff_date?: string;
    meeting_notes?: string;
    meeting_attendees?: string[];
    meeting_decisions?: MeetingDecision[];
  }
): Promise<ProjectKickoff> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // status가 draft이면 in_progress로 자동 변경
  const { data: current } = await supabase
    .from("project_kickoffs")
    .select("status, project_id")
    .eq("id", id)
    .single();

  const updateData: Record<string, unknown> = { ...data };
  if (current?.status === "draft") {
    updateData.status = "in_progress";
  }

  const { data: kickoff, error } = await supabase
    .from("project_kickoffs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`킥오프 수정 실패: ${error.message}`);

  if (current?.project_id) {
    revalidatePath(`/projects/${current.project_id}/kickoff`);
  }
  return kickoff as ProjectKickoff;
}

export async function completeKickoff(id: string): Promise<ProjectKickoff> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 모든 체크리스트 완료 확인
  const { data: items } = await supabase
    .from("kickoff_checklist_items")
    .select("is_completed")
    .eq("kickoff_id", id);

  const allCompleted = items && items.length > 0 && items.every((i) => i.is_completed);
  if (!allCompleted) {
    throw new Error("모든 체크리스트 항목을 완료해야 킥오프를 완료할 수 있습니다.");
  }

  const { data: kickoff, error } = await supabase
    .from("project_kickoffs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, project_id")
    .single();

  if (error) throw new Error(`킥오프 완료 실패: ${error.message}`);

  revalidatePath(`/projects/${kickoff.project_id}`);
  revalidatePath(`/projects/${kickoff.project_id}/kickoff`);
  revalidatePath(`/projects/${kickoff.project_id}/tasks`);
  return kickoff as ProjectKickoff;
}

// ─────────────────────────────────────────────
// Checklist CRUD
// ─────────────────────────────────────────────

export async function addChecklistItem(
  kickoffId: string,
  data: {
    title: string;
    description?: string;
    assignee_id?: string;
    due_date?: string;
  }
): Promise<KickoffChecklistItem> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // sort_order 자동 계산
  const { count } = await supabase
    .from("kickoff_checklist_items")
    .select("*", { count: "exact", head: true })
    .eq("kickoff_id", kickoffId);

  const { data: item, error } = await supabase
    .from("kickoff_checklist_items")
    .insert({
      kickoff_id: kickoffId,
      title: data.title,
      description: data.description || null,
      assignee_id: data.assignee_id || null,
      due_date: data.due_date || null,
      sort_order: count || 0,
    })
    .select("*, assignee:users!kickoff_checklist_items_assignee_id_fkey(name)")
    .single();

  if (error) throw new Error(`체크리스트 항목 추가 실패: ${error.message}`);

  // 킥오프의 project_id를 가져와서 revalidate
  const { data: kickoff } = await supabase
    .from("project_kickoffs")
    .select("project_id")
    .eq("id", kickoffId)
    .single();

  if (kickoff?.project_id) {
    revalidatePath(`/projects/${kickoff.project_id}/kickoff`);
  }
  return item as KickoffChecklistItem;
}

export async function toggleChecklistItem(id: string): Promise<KickoffChecklistItem> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 현재 상태 조회
  const { data: current } = await supabase
    .from("kickoff_checklist_items")
    .select("is_completed, kickoff_id")
    .eq("id", id)
    .single();

  if (!current) throw new Error("체크리스트 항목을 찾을 수 없습니다.");

  const { data: item, error } = await supabase
    .from("kickoff_checklist_items")
    .update({ is_completed: !current.is_completed })
    .eq("id", id)
    .select("*, assignee:users!kickoff_checklist_items_assignee_id_fkey(name)")
    .single();

  if (error) throw new Error(`체크리스트 토글 실패: ${error.message}`);

  const { data: kickoff } = await supabase
    .from("project_kickoffs")
    .select("project_id")
    .eq("id", current.kickoff_id)
    .single();

  if (kickoff?.project_id) {
    revalidatePath(`/projects/${kickoff.project_id}/kickoff`);
  }
  return item as KickoffChecklistItem;
}

export async function reorderChecklist(
  kickoffId: string,
  itemIds: string[]
): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 각 아이템의 sort_order 업데이트
  const updates = itemIds.map((id, idx) =>
    supabase
      .from("kickoff_checklist_items")
      .update({ sort_order: idx })
      .eq("id", id)
  );

  await Promise.all(updates);

  const { data: kickoff } = await supabase
    .from("project_kickoffs")
    .select("project_id")
    .eq("id", kickoffId)
    .single();

  if (kickoff?.project_id) {
    revalidatePath(`/projects/${kickoff.project_id}/kickoff`);
  }
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const { data: current } = await supabase
    .from("kickoff_checklist_items")
    .select("kickoff_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("kickoff_checklist_items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`체크리스트 삭제 실패: ${error.message}`);

  if (current?.kickoff_id) {
    const { data: kickoff } = await supabase
      .from("project_kickoffs")
      .select("project_id")
      .eq("id", current.kickoff_id)
      .single();

    if (kickoff?.project_id) {
      revalidatePath(`/projects/${kickoff.project_id}/kickoff`);
    }
  }
}

export async function updateChecklistItem(
  id: string,
  data: Partial<{ title: string; description: string; assignee_id: string; due_date: string }>
): Promise<KickoffChecklistItem> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const { data: item, error } = await supabase
    .from("kickoff_checklist_items")
    .update(data)
    .eq("id", id)
    .select("*, assignee:users!kickoff_checklist_items_assignee_id_fkey(name)")
    .single();

  if (error) throw new Error(`체크리스트 수정 실패: ${error.message}`);

  const { data: kickoff } = await supabase
    .from("project_kickoffs")
    .select("project_id")
    .eq("id", item.kickoff_id)
    .single();

  if (kickoff?.project_id) {
    revalidatePath(`/projects/${kickoff.project_id}/kickoff`);
  }
  return item as KickoffChecklistItem;
}

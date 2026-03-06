"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 액션아이템에서 태스크 자동 생성
 * 회의록 액션아이템 → tasks 테이블에 INSERT
 */
export async function createTaskFromActionItem(
  actionItemId: string,
  projectId?: string | null
): Promise<{ taskId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "인증 필요" };

  // 1. 액션아이템 조회
  const { data: actionItem } = await supabase
    .from("action_items")
    .select(
      "id, title, assignee_id, due_date, status, meeting_id, linked_task_id"
    )
    .eq("id", actionItemId)
    .single();

  if (!actionItem) return { error: "액션아이템을 찾을 수 없습니다" };
  if (actionItem.linked_task_id) return { error: "이미 연결된 태스크가 있습니다" };

  // 2. 태스크 생성
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title: actionItem.title,
      project_id: projectId ?? null,
      assignee_id: actionItem.assignee_id ?? user.id,
      created_by: user.id,
      due_date: actionItem.due_date ?? null,
      source: "meeting",
      source_id: actionItem.meeting_id,
      status: actionItem.status === "completed" ? "completed" : "pending",
    })
    .select("id")
    .single();

  if (error || !task) return { error: "태스크 생성 실패" };

  // 3. 액션아이템에 linked_task_id 업데이트
  await supabase
    .from("action_items")
    .update({ linked_task_id: task.id })
    .eq("id", actionItemId);

  revalidatePath("/tasks");
  revalidatePath("/meetings");
  return { taskId: task.id };
}

/**
 * 태스크 상태 변경 → 액션아이템 동기화
 * _sync_source 로 무한 루프 방지
 */
export async function syncTaskStatusToActionItem(
  taskId: string,
  newStatus: string,
  _syncSource?: string
): Promise<void> {
  if (_syncSource === "action_item") return; // 루프 방지

  const supabase = await createClient();

  // linked_task_id로 연결된 액션아이템 조회
  const { data: actionItems } = await supabase
    .from("action_items")
    .select("id")
    .eq("linked_task_id", taskId);

  if (!actionItems?.length) return;

  // 태스크 상태 → 액션아이템 상태 매핑
  const statusMap: Record<string, string> = {
    completed: "completed",
    in_progress: "in_progress",
    pending: "pending",
    review: "in_progress",
    issue: "in_progress",
  };
  const mappedStatus = statusMap[newStatus] ?? "pending";

  for (const ai of actionItems) {
    await supabase
      .from("action_items")
      .update({ status: mappedStatus })
      .eq("id", ai.id);
  }
}

/**
 * 액션아이템 상태 변경 → 태스크 동기화
 * _sync_source 로 무한 루프 방지
 */
export async function syncActionItemStatusToTask(
  actionItemId: string,
  newStatus: string,
  _syncSource?: string
): Promise<void> {
  if (_syncSource === "task") return; // 루프 방지

  const supabase = await createClient();

  const { data: actionItem } = await supabase
    .from("action_items")
    .select("linked_task_id")
    .eq("id", actionItemId)
    .single();

  if (!actionItem?.linked_task_id) return;

  // 액션아이템 상태 → 태스크 상태 매핑
  const statusMap: Record<string, string> = {
    completed: "completed",
    in_progress: "in_progress",
    pending: "pending",
  };
  const mappedStatus = statusMap[newStatus] ?? "pending";

  await supabase
    .from("tasks")
    .update({
      status: mappedStatus,
      ...(mappedStatus === "completed"
        ? { completed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", actionItem.linked_task_id);
}

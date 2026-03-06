"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskSource,
  TaskDependency,
  DependencyType,
} from "@/types/task.types";

// ─────────────────────────────────────────────
// Task CRUD
// ─────────────────────────────────────────────

export async function createTask(data: {
  project_id?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  weight?: number;
  assignee_id?: string;
  due_date?: string;
  estimated_hours?: number;
  parent_task_id?: string;
  milestone_id?: string;
  source?: TaskSource;
  source_id?: string;
  labels?: string[];
}): Promise<Task> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 킥오프 완료 필수 체크 (general 프로젝트 타입)
  if (data.project_id) {
    const { data: proj } = await supabase
      .from("projects")
      .select("project_type")
      .eq("id", data.project_id)
      .single();

    if (!proj?.project_type || proj.project_type === "general") {
      const { data: kickoff } = await supabase
        .from("project_kickoffs")
        .select("status")
        .eq("project_id", data.project_id)
        .single();

      if (kickoff && kickoff.status !== "completed") {
        throw new Error("킥오프를 먼저 완료해야 Task를 생성할 수 있습니다.");
      }
    }
  }

  // sort_order 자동 계산
  let sortOrder = 0;
  if (data.project_id) {
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", data.project_id)
      .is("parent_task_id", null);
    sortOrder = count || 0;
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: data.project_id || null,
      title: data.title,
      description: data.description || null,
      priority: data.priority || "normal",
      weight: data.weight || 1,
      assignee_id: data.assignee_id || null,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours || null,
      parent_task_id: data.parent_task_id || null,
      milestone_id: data.milestone_id || null,
      source: data.source || "manual",
      source_id: data.source_id || null,
      labels: data.labels || [],
      sort_order: sortOrder,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Task 생성 실패: ${error.message}`);

  if (data.project_id) {
    revalidatePath(`/projects/${data.project_id}`);
    revalidatePath(`/projects/${data.project_id}/tasks`);
  }
  revalidatePath("/tasks");
  return task as Task;
}

export async function updateTask(
  id: string,
  data: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "weight" | "assignee_id" | "due_date" | "estimated_hours" | "actual_hours" | "parent_task_id" | "milestone_id" | "labels" | "sort_order">>
): Promise<Task> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // completed_at 자동 설정
  const updateData: Record<string, unknown> = { ...data };
  if (data.status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (data.status) {
    updateData.completed_at = null;
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Task 업데이트 실패: ${error.message}`);

  if (task.project_id) {
    revalidatePath(`/projects/${task.project_id}`);
    revalidatePath(`/projects/${task.project_id}/tasks`);
  }
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return task as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // Task 정보를 먼저 조회하여 project_id 확보
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(`Task 조회 실패: ${fetchError.message}`);

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) throw new Error(`Task 삭제 실패: ${error.message}`);

  if (task.project_id) {
    revalidatePath(`/projects/${task.project_id}`);
    revalidatePath(`/projects/${task.project_id}/tasks`);
  }
  revalidatePath("/tasks");
}

// ─────────────────────────────────────────────
// 상태 변경 (completed_at 자동 설정)
// ─────────────────────────────────────────────

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<Task> {
  return updateTask(id, { status });
}

// ─────────────────────────────────────────────
// Kanban 정렬 순서 업데이트 (벌크)
// ─────────────────────────────────────────────

export async function reorderTasks(
  updates: { id: string; status: TaskStatus; sort_order: number }[]
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 각 Task를 개별 업데이트 (Supabase는 벌크 upsert 조건 업데이트 미지원)
  const promises = updates.map(async (u) => {
    const updateData: Record<string, unknown> = {
      status: u.status,
      sort_order: u.sort_order,
    };

    // completed_at 자동 설정
    if (u.status === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", u.id);

    if (error) throw new Error(`Task 정렬 업데이트 실패: ${error.message}`);
  });

  await Promise.all(promises);

  revalidatePath("/tasks");
  revalidatePath("/projects");
}

// ─────────────────────────────────────────────
// 의존성 관리
// ─────────────────────────────────────────────

export async function addDependency(
  taskId: string,
  dependsOnId: string,
  type: DependencyType = "finish_to_start"
): Promise<TaskDependency> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 순환 참조 검증
  const validation = await validateDependency(taskId, dependsOnId);
  if (!validation.valid) {
    throw new Error(
      `순환 참조가 감지되었습니다: ${validation.cycle?.join(" -> ")}`
    );
  }

  const { data: dep, error } = await supabase
    .from("task_dependencies")
    .insert({
      task_id: taskId,
      depends_on_id: dependsOnId,
      dependency_type: type,
    })
    .select()
    .single();

  if (error) throw new Error(`의존성 추가 실패: ${error.message}`);

  revalidatePath("/tasks");
  return dep as TaskDependency;
}

export async function removeDependency(depId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("id", depId);

  if (error) throw new Error(`의존성 삭제 실패: ${error.message}`);

  revalidatePath("/tasks");
}

// ─────────────────────────────────────────────
// DAG 순환 참조 검증 (DFS)
// ─────────────────────────────────────────────

export async function validateDependency(
  taskId: string,
  dependsOnId: string
): Promise<{ valid: boolean; cycle?: string[] }> {
  const supabase = await createClient();

  // 자기 자신 참조 방지
  if (taskId === dependsOnId) {
    return { valid: false, cycle: [taskId, dependsOnId] };
  }

  // 모든 의존성 관계 로드
  const { data: allDeps, error } = await supabase
    .from("task_dependencies")
    .select("task_id, depends_on_id");

  if (error) throw new Error(`의존성 조회 실패: ${error.message}`);

  // 인접 리스트 구성 (task_id -> depends_on_id[])
  const adjacency = new Map<string, string[]>();
  for (const dep of allDeps || []) {
    const existing = adjacency.get(dep.task_id) || [];
    existing.push(dep.depends_on_id);
    adjacency.set(dep.task_id, existing);
  }

  // 새 의존성 추가 (가상)
  const existingForTask = adjacency.get(taskId) || [];
  existingForTask.push(dependsOnId);
  adjacency.set(taskId, existingForTask);

  // DFS로 순환 검증: dependsOnId에서 시작해서 taskId에 도달할 수 있는지
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(current: string): boolean {
    if (current === taskId) {
      path.push(current);
      return true; // 순환 발견
    }
    if (visited.has(current)) return false;

    visited.add(current);
    path.push(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    path.pop();
    return false;
  }

  const hasCycle = dfs(dependsOnId);

  if (hasCycle) {
    return { valid: false, cycle: path };
  }

  return { valid: true };
}

// ─────────────────────────────────────────────
// 액션아이템 -> Task 승격
// ─────────────────────────────────────────────

export async function promoteActionItemToTask(
  actionItemId: string,
  projectId: string
): Promise<Task> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 액션아이템 조회 (postmortems의 action_items jsonb에서)
  // 또는 회의록의 action_items에서 가져올 수 있음
  // 여기서는 범용적으로 meetings 테이블의 action_items 기준

  // postmortem action_items 검색
  const { data: postmortems } = await supabase
    .from("postmortems")
    .select("id, action_items")
    .eq("project_id", projectId);

  let actionItem: { text?: string; title?: string; assignee?: string } | null = null;
  let sourceId: string | null = null;

  // postmortem에서 검색
  for (const pm of postmortems || []) {
    const items = (pm.action_items as Array<Record<string, unknown>>) || [];
    const found = items.find(
      (item: Record<string, unknown>) => (item as { id?: string }).id === actionItemId
    );
    if (found) {
      actionItem = found as { text?: string; title?: string; assignee?: string };
      sourceId = pm.id;
      break;
    }
  }

  if (!actionItem) {
    throw new Error("액션아이템을 찾을 수 없습니다.");
  }

  const task = await createTask({
    project_id: projectId,
    title: actionItem.text || actionItem.title || "승격된 액션아이템",
    source: "meeting",
    source_id: sourceId || undefined,
  });

  return task;
}

// ─────────────────────────────────────────────
// 노드 위치 저장 (의존성 맵)
// ─────────────────────────────────────────────

export async function updateTaskPositions(
  updates: { id: string; x: number; y: number }[]
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const promises = updates.map(async (u) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        node_position_x: u.x,
        node_position_y: u.y,
      })
      .eq("id", u.id);

    if (error) throw new Error(`노드 위치 업데이트 실패: ${error.message}`);
  });

  await Promise.all(promises);
}

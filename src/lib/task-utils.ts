import type { Task, TaskDependency } from "@/types/task.types";

/**
 * DAG 순환 참조 검증 (DFS 기반) - 클라이언트 사이드 버전
 * 새 의존성(taskId depends on dependsOnId)을 추가했을 때 순환이 발생하는지 확인
 */
export function detectCycle(
  taskId: string,
  dependsOnId: string,
  edges: { task_id: string; depends_on_id: string }[]
): { hasCycle: boolean; path?: string[] } {
  // 자기 자신 참조 방지
  if (taskId === dependsOnId) {
    return { hasCycle: true, path: [taskId, dependsOnId] };
  }

  // 인접 리스트 구성 (task_id -> depends_on_id[])
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = adjacency.get(edge.task_id) || [];
    existing.push(edge.depends_on_id);
    adjacency.set(edge.task_id, existing);
  }

  // 새 의존성 가상 추가
  const existingForTask = adjacency.get(taskId) || [];
  existingForTask.push(dependsOnId);
  adjacency.set(taskId, existingForTask);

  // DFS: dependsOnId에서 시작해서 taskId에 도달할 수 있는지
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(current: string): boolean {
    if (current === taskId) {
      path.push(current);
      return true;
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
    return { hasCycle: true, path };
  }

  return { hasCycle: false };
}

/**
 * 크리티컬 패스 계산
 * 가장 긴 경로를 찾아 병목 Task를 식별
 */
export function findCriticalPath(
  tasks: Task[],
  deps: TaskDependency[]
): string[] {
  if (tasks.length === 0) return [];

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // 인접 리스트 (depends_on_id -> task_id[])
  // 즉, 선행 Task -> 후행 Task 방향
  const forward = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // 초기화
  for (const t of tasks) {
    forward.set(t.id, []);
    inDegree.set(t.id, 0);
  }

  for (const dep of deps) {
    const fwd = forward.get(dep.depends_on_id);
    if (fwd) fwd.push(dep.task_id);

    inDegree.set(dep.task_id, (inDegree.get(dep.task_id) || 0) + 1);
  }

  // 위상 정렬 + 최장 경로 계산
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const queue: string[] = [];

  for (const t of tasks) {
    const weight = t.weight || 1;
    dist.set(t.id, weight);
    prev.set(t.id, null);

    if ((inDegree.get(t.id) || 0) === 0) {
      queue.push(t.id);
    }
  }

  // BFS 위상 정렬
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentDist = dist.get(current) || 0;
    const neighbors = forward.get(current) || [];

    for (const next of neighbors) {
      const nextTask = taskMap.get(next);
      const nextWeight = nextTask?.weight || 1;
      const newDist = currentDist + nextWeight;

      if (newDist > (dist.get(next) || 0)) {
        dist.set(next, newDist);
        prev.set(next, current);
      }

      const newInDegree = (inDegree.get(next) || 1) - 1;
      inDegree.set(next, newInDegree);
      if (newInDegree === 0) {
        queue.push(next);
      }
    }
  }

  // 최장 거리를 가진 노드 찾기
  let maxDist = 0;
  let endNode: string | null = null;

  for (const [id, d] of dist) {
    if (d > maxDist) {
      maxDist = d;
      endNode = id;
    }
  }

  if (!endNode) return [];

  // 역추적
  const path: string[] = [];
  let current: string | null = endNode;
  while (current) {
    path.unshift(current);
    current = prev.get(current) || null;
  }

  return path;
}

/**
 * 진행률 계산 유틸
 * 완료된 Task 수 / 전체 Task 수 (가중치 고려)
 */
export function calculateProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;

  const totalWeight = tasks.reduce((sum, t) => sum + (t.weight || 1), 0);
  const completedWeight = tasks
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.weight || 1), 0);

  if (totalWeight === 0) return 0;

  return Math.round((completedWeight / totalWeight) * 100 * 10) / 10;
}

/**
 * 상태 전파 확인
 * 특정 Task가 지연되었을 때 영향을 받는 후행 Task 목록 반환
 */
export function getAffectedTasks(
  taskId: string,
  deps: TaskDependency[]
): string[] {
  // taskId가 depends_on_id인 의존성 = taskId를 선행으로 가지는 후행 Task
  const forward = new Map<string, string[]>();

  for (const dep of deps) {
    const existing = forward.get(dep.depends_on_id) || [];
    existing.push(dep.task_id);
    forward.set(dep.depends_on_id, existing);
  }

  // BFS로 모든 영향 받는 Task 수집
  const affected = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const dependents = forward.get(current) || [];

    for (const dep of dependents) {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push(dep);
      }
    }
  }

  return Array.from(affected);
}

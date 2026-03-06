/**
 * DAG 검증 유틸리티 — 클라이언트 사이드 순환 참조 검증
 */

interface Edge {
  source: string;
  target: string;
}

/**
 * DFS 기반 순환 참조 검증
 * @param edges 기존 엣지 목록
 * @param newSource 새 연결의 소스 노드 ID
 * @param newTarget 새 연결의 타겟 노드 ID
 * @returns { valid, cycle } — 순환이 있으면 valid=false, cycle에 경로 반환
 */
export function validateDAG(
  edges: Edge[],
  newSource: string,
  newTarget: string
): { valid: boolean; cycle?: string[] } {
  // 자기 자신 참조 방지
  if (newSource === newTarget) {
    return { valid: false, cycle: [newSource, newTarget] };
  }

  // 인접 리스트 구성 (source -> target[])
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = adjacency.get(edge.source) || [];
    existing.push(edge.target);
    adjacency.set(edge.source, existing);
  }

  // 새 엣지 추가 (가상)
  const existingForSource = adjacency.get(newSource) || [];
  existingForSource.push(newTarget);
  adjacency.set(newSource, existingForSource);

  // DFS: newTarget에서 시작해서 newSource에 도달할 수 있는지 검증
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(current: string): boolean {
    if (current === newSource) {
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

  const hasCycle = dfs(newTarget);

  if (hasCycle) {
    return { valid: false, cycle: path };
  }

  return { valid: true };
}

/**
 * 크리티컬 패스 계산 (최장 경로)
 * @param nodes 노드 ID 목록
 * @param edges 엣지 목록
 * @returns 크리티컬 패스에 포함된 노드 ID 목록
 */
export function findCriticalPath(
  nodes: string[],
  edges: Edge[]
): string[] {
  // 인접 리스트 + 역방향 인접 리스트
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of nodes) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // 위상 정렬 (Kahn's algorithm)
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();

  for (const id of nodes) {
    dist.set(id, 0);
    prev.set(id, null);
  }

  const topOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topOrder.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDist = (dist.get(current) || 0) + 1;
      if (newDist > (dist.get(neighbor) || 0)) {
        dist.set(neighbor, newDist);
        prev.set(neighbor, current);
      }

      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // 최장 경로 종단 노드 찾기
  let maxDist = 0;
  let endNode: string | null = null;

  for (const [id, d] of dist) {
    if (d >= maxDist) {
      maxDist = d;
      endNode = id;
    }
  }

  if (!endNode || maxDist === 0) return [];

  // 역추적으로 크리티컬 패스 구성
  const criticalPath: string[] = [];
  let current: string | null = endNode;
  while (current) {
    criticalPath.unshift(current);
    current = prev.get(current) || null;
  }

  return criticalPath;
}

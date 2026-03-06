"use client";

import { useCallback, useEffect, useMemo, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  BackgroundVariant,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskNode, type TaskNodeData } from "./task-node";
import { DependencyEdge, type DependencyEdgeData } from "./dependency-edge";
import { DependencyMinimap } from "./dependency-minimap";
import { DependencyToolbar } from "./dependency-toolbar";
import { DependencyOverview } from "./dependency-overview";
import { validateDAG } from "./dag-validator";
import {
  addDependency,
  removeDependency,
  updateTaskPositions,
} from "@/actions/task";
import type { Task, TaskDependency, TaskStatus } from "@/types/task.types";
import { TASK_PRIORITY_CONFIG, type TaskPriority } from "@/types/task.types";

interface User {
  id: string;
  name: string;
}

interface DependencyMapCanvasProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  projectId: string;
  users: User[];
}

const nodeTypes: NodeTypes = {
  taskNode: TaskNode,
};

const edgeTypes: EdgeTypes = {
  dependencyEdge: DependencyEdge,
};

function DependencyMapInner({
  tasks,
  dependencies,
  projectId,
  users,
}: DependencyMapCanvasProps) {
  const [criticalPathNodes, setCriticalPathNodes] = useState<string[] | null>(null);
  const [filter, setFilter] = useState<{
    assignees: string[];
    statuses: TaskStatus[];
  }>({ assignees: [], statuses: [] });
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const positionUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Task -> React Flow 노드 변환
  const initialNodes = useMemo(() => {
    const now = new Date();
    return tasks.map((task): Node<TaskNodeData> => {
      const isOverdue =
        !!task.due_date &&
        new Date(task.due_date) < now &&
        task.status !== "completed";

      const hasFilter =
        filter.assignees.length > 0 || filter.statuses.length > 0;

      const matchesAssignee =
        filter.assignees.length === 0 ||
        (task.assignee_id && filter.assignees.includes(task.assignee_id));
      const matchesStatus =
        filter.statuses.length === 0 || filter.statuses.includes(task.status);

      const isHighlighted = !hasFilter || (!!matchesAssignee && matchesStatus);

      return {
        id: task.id,
        type: "taskNode",
        position: {
          x: task.node_position_x || 0,
          y: task.node_position_y || 0,
        },
        data: {
          taskId: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assigneeName: task.assignee?.name || null,
          dueDate: task.due_date
            ? new Date(task.due_date).toLocaleDateString("ko-KR", {
                month: "short",
                day: "numeric",
              })
            : null,
          isOverdue,
          isCriticalPath: criticalPathNodes?.includes(task.id) ?? false,
          isHighlighted,
        },
      };
    });
  }, [tasks, criticalPathNodes, filter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<DependencyEdgeData>>([]);

  // 의존성 삭제 핸들러
  const handleRemoveDependency = useCallback(
    async (depId: string) => {
      try {
        await removeDependency(depId);
        setEdges((eds) =>
          eds.filter((e) => (e.data as DependencyEdgeData)?.dependencyId !== depId)
        );
        toast.success("의존성이 삭제되었습니다.");
      } catch (err) {
        toast.error("의존성 삭제 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    },
    [setEdges]
  );

  // 의존성이 변경될 때 엣지 업데이트
  useEffect(() => {
    const newEdges = dependencies.map((dep): Edge<DependencyEdgeData> => {
      const isCritical =
        criticalPathNodes?.includes(dep.depends_on_id) &&
        criticalPathNodes?.includes(dep.task_id);

      return {
        id: `dep-${dep.id}`,
        source: dep.depends_on_id,
        target: dep.task_id,
        type: "dependencyEdge",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
        },
        data: {
          dependencyId: dep.id,
          dependencyType: dep.dependency_type,
          onRemove: handleRemoveDependency,
          isCriticalPath: !!isCritical,
        },
      };
    });
    setEdges(newEdges);
  }, [dependencies, criticalPathNodes, handleRemoveDependency, setEdges]);

  // 노드 연결 시 의존성 추가
  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // 클라이언트 사이드 DAG 검증
      const currentEdges = edges.map((e) => ({
        source: e.source,
        target: e.target,
      }));
      const validation = validateDAG(
        currentEdges,
        connection.source,
        connection.target
      );

      if (!validation.valid) {
        toast.error("순환 참조가 감지되었습니다", {
          description: `경로: ${validation.cycle?.join(" → ")}`,
        });
        return;
      }

      try {
        // 서버에 의존성 추가 (source = depends_on, target = task_id)
        const dep = await addDependency(
          connection.target,
          connection.source,
          "finish_to_start"
        );

        const newEdge: Edge<DependencyEdgeData> = {
          id: `dep-${dep.id}`,
          source: connection.source,
          target: connection.target,
          type: "dependencyEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
          },
          data: {
            dependencyId: dep.id,
            dependencyType: dep.dependency_type,
            onRemove: handleRemoveDependency,
            isCriticalPath: false,
          },
        };

        setEdges((eds) => addEdge(newEdge, eds));
        toast.success("의존성이 추가되었습니다.");
      } catch (err) {
        toast.error("의존성 추가 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    },
    [edges, setEdges, handleRemoveDependency]
  );

  // 노드 드래그 종료 시 위치 저장 (디바운스)
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (positionUpdateTimer.current) {
        clearTimeout(positionUpdateTimer.current);
      }

      positionUpdateTimer.current = setTimeout(async () => {
        try {
          await updateTaskPositions([
            { id: node.id, x: node.position.x, y: node.position.y },
          ]);
        } catch {
          // 위치 저장 실패는 무시 (UX 방해하지 않음)
        }
      }, 500);
    },
    []
  );

  // 크리티컬 패스 토글
  const handleCriticalPathToggle = useCallback(
    (nodeIds: string[] | null) => {
      setCriticalPathNodes(nodeIds);

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isCriticalPath: nodeIds?.includes(n.id) ?? false,
          } as TaskNodeData,
        }))
      );

      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: {
            ...(e.data as DependencyEdgeData),
            isCriticalPath:
              !!nodeIds?.includes(e.source) && !!nodeIds?.includes(e.target),
          } as DependencyEdgeData,
        }))
      );
    },
    [setNodes, setEdges]
  );

  // 필터 변경
  const handleFilterChange = useCallback(
    (newFilter: { assignees: string[]; statuses: TaskStatus[] }) => {
      setFilter(newFilter);

      const hasFilter =
        newFilter.assignees.length > 0 || newFilter.statuses.length > 0;

      setNodes((nds) =>
        nds.map((n) => {
          const data = n.data as TaskNodeData;
          const task = tasks.find((t) => t.id === n.id);
          if (!task) return n;

          const matchesAssignee =
            newFilter.assignees.length === 0 ||
            (task.assignee_id &&
              newFilter.assignees.includes(task.assignee_id));
          const matchesStatus =
            newFilter.statuses.length === 0 ||
            newFilter.statuses.includes(task.status);

          return {
            ...n,
            data: {
              ...data,
              isHighlighted: !hasFilter || (!!matchesAssignee && matchesStatus),
            } as TaskNodeData,
          };
        })
      );
    },
    [setNodes, tasks]
  );

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-sm gap-2 flex-wrap">
        <DependencyToolbar
          users={users}
          onAddTask={() => setTaskDialogOpen(true)}
          onCriticalPathToggle={handleCriticalPathToggle}
          onFilterChange={handleFilterChange}
        />
        <DependencyOverview tasks={tasks} />
      </div>

      {/* React Flow 캔버스 */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "dependencyEdge",
          }}
          connectionLineStyle={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="!bg-background"
            color="hsl(var(--muted-foreground) / 0.15)"
          />
          <DependencyMinimap />

          {/* SVG 마커 정의 */}
          <svg>
            <defs>
              <marker
                id="dependency-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="hsl(var(--muted-foreground) / 0.5)"
                />
              </marker>
            </defs>
          </svg>
        </ReactFlow>
      </div>

      {/* Task 생성 다이얼로그 — 외부 제어용 인라인 다이얼로그 */}
      <InlineTaskCreateDialog
        projectId={projectId}
        users={users}
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
      />
    </div>
  );
}

/**
 * 인라인 Task 생성 다이얼로그 — open/onOpenChange를 외부에서 제어
 */
function InlineTaskCreateDialog({
  projectId,
  users,
  open,
  onOpenChange,
}: {
  projectId: string;
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [assigneeId, setAssigneeId] = useState("");
  const router = useRouter();

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Task 제목을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const { createTask } = await import("@/actions/task");
        await createTask({
          project_id: projectId,
          title: title.trim(),
          priority,
          assignee_id: assigneeId || undefined,
        });

        toast.success("Task가 생성되었습니다.");
        setTitle("");
        setPriority("normal");
        setAssigneeId("");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error("Task 생성 실패", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    });
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>새 Task 추가</DialogTitle>
          <DialogDescription>
            의존성 맵에 새 Task를 추가합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Task 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) handleSubmit();
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">우선순위</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {(Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriority, { label: string }][]).map(
                  ([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">담당자</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">미배정</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "생성 중..." : "생성"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DependencyMapCanvas(props: DependencyMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <DependencyMapInner {...props} />
    </ReactFlowProvider>
  );
}

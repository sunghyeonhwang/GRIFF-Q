"use client";

import { useState } from "react";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import dagre from "dagre";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutGrid,
  Filter,
  Zap,
  Plus,
  Users,
  CheckSquare,
} from "lucide-react";
import { TASK_STATUS_CONFIG, type TaskStatus } from "@/types/task.types";
import { findCriticalPath } from "./dag-validator";
import type { TaskNodeData } from "./task-node";

interface User {
  id: string;
  name: string;
}

interface DependencyToolbarProps {
  users: User[];
  onAddTask: () => void;
  onCriticalPathToggle: (nodeIds: string[] | null) => void;
  onFilterChange: (filter: {
    assignees: string[];
    statuses: TaskStatus[];
  }) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

function getLayoutedElements(
  nodes: Node<TaskNodeData>[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) =>
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  );
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

export function DependencyToolbar({
  users,
  onAddTask,
  onCriticalPathToggle,
  onFilterChange,
}: DependencyToolbarProps) {
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
  const [criticalPathActive, setCriticalPathActive] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);

  // 자동 정렬 (dagre)
  function handleAutoLayout() {
    const nodes = getNodes() as Node<TaskNodeData>[];
    const edges = getEdges();
    const layouted = getLayoutedElements(nodes, edges, "TB");
    setNodes(layouted);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }

  // 크리티컬 패스 토글
  function handleCriticalPath() {
    if (criticalPathActive) {
      setCriticalPathActive(false);
      onCriticalPathToggle(null);
      return;
    }

    const nodes = getNodes();
    const edges = getEdges();
    const nodeIds = nodes.map((n) => n.id);
    const edgeData = edges.map((e) => ({ source: e.source, target: e.target }));
    const path = findCriticalPath(nodeIds, edgeData);

    setCriticalPathActive(true);
    onCriticalPathToggle(path);
  }

  // 담당자 필터 토글
  function toggleAssignee(userId: string) {
    const next = selectedAssignees.includes(userId)
      ? selectedAssignees.filter((a) => a !== userId)
      : [...selectedAssignees, userId];
    setSelectedAssignees(next);
    onFilterChange({ assignees: next, statuses: selectedStatuses });
  }

  // 상태 필터 토글
  function toggleStatus(status: TaskStatus) {
    const next = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    setSelectedStatuses(next);
    onFilterChange({ assignees: selectedAssignees, statuses: next });
  }

  // 필터 리셋
  function resetFilters() {
    setSelectedAssignees([]);
    setSelectedStatuses([]);
    onFilterChange({ assignees: [], statuses: [] });
  }

  const hasFilters = selectedAssignees.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 자동 정렬 */}
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAutoLayout}>
        <LayoutGrid className="size-3.5" />
        자동 정렬
      </Button>

      {/* 크리티컬 패스 */}
      <Button
        variant={criticalPathActive ? "default" : "outline"}
        size="sm"
        className="gap-1.5"
        onClick={handleCriticalPath}
      >
        <Zap className="size-3.5" />
        크리티컬 패스
      </Button>

      {/* 담당자 필터 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Users className="size-3.5" />
            담당자
            {selectedAssignees.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {selectedAssignees.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>담당자 필터</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {users.map((user) => (
            <DropdownMenuCheckboxItem
              key={user.id}
              checked={selectedAssignees.includes(user.id)}
              onCheckedChange={() => toggleAssignee(user.id)}
            >
              {user.name}
            </DropdownMenuCheckboxItem>
          ))}
          {users.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              멤버가 없습니다
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 상태 필터 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <CheckSquare className="size-3.5" />
            상태
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>상태 필터</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.entries(TASK_STATUS_CONFIG) as [TaskStatus, { label: string }][]).map(
            ([key, cfg]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={selectedStatuses.includes(key)}
                onCheckedChange={() => toggleStatus(key)}
              >
                {cfg.label}
              </DropdownMenuCheckboxItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 필터 리셋 */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={resetFilters}
        >
          <Filter className="size-3 mr-1" />
          초기화
        </Button>
      )}

      {/* 구분선 */}
      <div className="h-6 w-px bg-border mx-1" />

      {/* Task 추가 */}
      <Button size="sm" className="gap-1.5" onClick={onAddTask}>
        <Plus className="size-3.5" />
        Task 추가
      </Button>
    </div>
  );
}

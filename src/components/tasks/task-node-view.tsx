"use client";

import dynamic from "next/dynamic";
import type { Task, TaskDependency } from "@/types/task.types";

const DependencyMapCanvas = dynamic(
  () =>
    import("@/components/tasks/dependency-map/dependency-map-canvas").then(
      (m) => m.DependencyMapCanvas,
    ),
  {
    loading: () => (
      <div className="h-[600px] flex items-center justify-center rounded-lg border bg-muted/30">
        <p className="text-muted-foreground text-sm">의존성 맵 로딩 중...</p>
      </div>
    ),
  },
);

interface TaskNodeViewProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  projectId: string;
  users: { id: string; name: string }[];
}

export function TaskNodeView({
  tasks,
  dependencies,
  projectId,
  users,
}: TaskNodeViewProps) {
  return (
    <div className="rounded-lg border overflow-hidden h-[calc(100vh-20rem)]  min-h-[500px]">
      <DependencyMapCanvas
        tasks={tasks}
        dependencies={dependencies}
        projectId={projectId}
        users={users}
      />
    </div>
  );
}

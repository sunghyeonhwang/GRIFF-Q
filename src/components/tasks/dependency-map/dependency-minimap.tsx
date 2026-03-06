"use client";

import { MiniMap, Controls, useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import type { TaskStatus } from "@/types/task.types";

const MINIMAP_NODE_COLOR: Record<TaskStatus, string> = {
  pending: "#9ca3af",
  in_progress: "#3b82f6",
  review: "#eab308",
  completed: "#22c55e",
  issue: "#ef4444",
};

export function DependencyMinimap() {
  const { fitView } = useReactFlow();

  return (
    <>
      {/* MiniMap */}
      <MiniMap
        nodeColor={(node) => {
          const status = (node.data as { status?: TaskStatus })?.status;
          return status ? MINIMAP_NODE_COLOR[status] : "#9ca3af";
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
        className="!bg-background/80 !border !border-border !rounded-lg !shadow-sm"
        pannable
        zoomable
      />

      {/* Controls (Zoom +/-) */}
      <Controls
        showInteractive={false}
        className="!bg-background !border !border-border !rounded-lg !shadow-sm [&>button]:!bg-background [&>button]:!border-border [&>button]:!fill-foreground hover:[&>button]:!bg-muted"
      />

      {/* Fit View 버튼 */}
      <div className="absolute bottom-4 left-4 z-10">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shadow-sm"
          onClick={() => fitView({ padding: 0.2, duration: 300 })}
        >
          <Maximize2 className="size-3.5" />
          전체 보기
        </Button>
      </div>
    </>
  );
}

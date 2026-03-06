"use client";

import { memo, useState } from "react";
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DependencyType } from "@/types/task.types";

export type DependencyEdgeData = {
  dependencyId: string;
  dependencyType: DependencyType;
  onRemove: (depId: string) => void;
  isCriticalPath?: boolean;
};

type DependencyEdgeType = Edge<DependencyEdgeData, "dependencyEdge">;

const DEPENDENCY_LABELS: Record<DependencyType, string> = {
  finish_to_start: "FS",
  start_to_start: "SS",
  finish_to_finish: "FF",
};

function DependencyEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<DependencyEdgeType>) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  const isCritical = data?.isCriticalPath ?? false;

  return (
    <>
      {/* 투명한 넓은 히트 영역 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* 실제 보이는 엣지 */}
      <path
        d={edgePath}
        fill="none"
        className={cn(
          "transition-all",
          isCritical
            ? "stroke-orange-500 dark:stroke-orange-400"
            : selected
              ? "stroke-primary"
              : "stroke-muted-foreground/40"
        )}
        strokeWidth={isCritical ? 2.5 : selected ? 2 : 1.5}
        strokeDasharray={isCritical ? "" : ""}
        markerEnd="url(#dependency-arrow)"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* 엣지 라벨 + 삭제 버튼 */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute flex items-center gap-1 pointer-events-auto rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
            isCritical
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
              : "bg-muted text-muted-foreground",
            (hovered || selected) && "shadow-sm"
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span>{data ? DEPENDENCY_LABELS[data.dependencyType] : "FS"}</span>
          {(hovered || selected) && data?.onRemove && (
            <button
              className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                data.onRemove(data.dependencyId);
              }}
              title="의존성 삭제"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const DependencyEdge = memo(DependencyEdgeComponent);

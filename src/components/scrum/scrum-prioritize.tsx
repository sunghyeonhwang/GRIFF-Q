"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GripVertical, ArrowLeft, ArrowRight, List, Grid2x2 } from "lucide-react";
import { toast } from "sonner";
import type { ScrumItem, ScrumItemPriority } from "@/types/scrum.types";
import { PRIORITY_CONFIG } from "@/types/scrum.types";
import { reorderScrumItems, updateScrumItem } from "@/actions/scrum";
import { ScrumEisenhower } from "./scrum-eisenhower";
import { cn } from "@/lib/utils";

interface ScrumPrioritizeProps {
  scrumId: string;
  items: ScrumItem[];
  onItemsChange: (items: ScrumItem[]) => void;
  onPrev: () => void;
  onNext: () => void;
}

function SortableRow({
  item,
  onPriorityChange,
}: {
  item: ScrumItem;
  onPriorityChange: (id: string, priority: ScrumItemPriority) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = PRIORITY_CONFIG[item.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border px-3 py-2 bg-background"
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Badge className={cn("text-xs shrink-0", config.bgColor, config.color)} variant="outline">
        {config.label}
      </Badge>
      <span className="text-sm flex-1 truncate">{item.title}</span>
      <Select
        value={item.priority}
        onValueChange={(v) => onPriorityChange(item.id, v as ScrumItemPriority)}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>
              {cfg.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ScrumPrioritize({
  scrumId,
  items,
  onItemsChange,
  onPrev,
  onNext,
}: ScrumPrioritizeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIdx = items.findIndex((i) => i.id === active.id);
      const newIdx = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIdx, newIdx);
      onItemsChange(reordered);

      try {
        await reorderScrumItems(scrumId, reordered.map((i) => i.id));
      } catch {
        onItemsChange(items);
        toast.error("순서 변경 실패");
      }
    },
    [items, scrumId, onItemsChange]
  );

  const handlePriorityChange = useCallback(
    async (itemId: string, priority: ScrumItemPriority) => {
      const updated = items.map((i) =>
        i.id === itemId ? { ...i, priority } : i
      );
      onItemsChange(updated);
      try {
        await updateScrumItem(itemId, { priority });
      } catch {
        onItemsChange(items);
        toast.error("우선순위 변경 실패");
      }
    },
    [items, onItemsChange]
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="gap-1">
            <List className="h-3.5 w-3.5" />
            목록
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-1">
            <Grid2x2 className="h-3.5 w-3.5" />
            매트릭스
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-3 space-y-1">
          <p className="text-xs text-muted-foreground mb-2">
            드래그로 순서를 변경하고, 우선순위를 설정하세요
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onPriorityChange={handlePriorityChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </TabsContent>
        <TabsContent value="matrix" className="mt-3">
          <ScrumEisenhower items={items} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <Button onClick={onNext}>
          다음: 시간 배치
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import {
  addChecklistItem,
  toggleChecklistItem,
  reorderChecklist,
  deleteChecklistItem,
} from "@/actions/kickoff";
import { toast } from "sonner";
import type { KickoffChecklistItem } from "@/types/kickoff.types";

interface KickoffChecklistProps {
  kickoffId: string;
  items: KickoffChecklistItem[];
  canEdit: boolean;
  users: { id: string; name: string }[];
}

function SortableItem({
  item,
  canEdit,
  onToggle,
  onDelete,
}: {
  item: KickoffChecklistItem;
  canEdit: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
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

  const daysLeft = item.due_date
    ? Math.ceil((new Date(item.due_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        item.is_completed ? "bg-muted/50" : ""
      }`}
    >
      {canEdit && (
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={() => onToggle(item.id)}
        disabled={!canEdit}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.is_completed ? "line-through text-muted-foreground" : "font-medium"}`}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
        )}
      </div>
      {item.assignee?.name && (
        <Badge variant="outline" className="text-xs shrink-0">
          @{item.assignee.name}
        </Badge>
      )}
      {daysLeft !== null && (
        <span className={`text-xs shrink-0 ${daysLeft <= 1 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {daysLeft <= 0 ? "D-day" : `D-${daysLeft}`}
        </span>
      )}
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}

export function KickoffChecklist({ kickoffId, items, canEdit, users }: KickoffChecklistProps) {
  const [sortedItems, setSortedItems] = useState(items);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedItems.findIndex((i) => i.id === active.id);
    const newIndex = sortedItems.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(sortedItems, oldIndex, newIndex);
    setSortedItems(newItems);

    startTransition(async () => {
      try {
        await reorderChecklist(kickoffId, newItems.map((i) => i.id));
      } catch {
        setSortedItems(items); // 롤백
      }
    });
  }

  function handleToggle(id: string) {
    // Optimistic update
    setSortedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_completed: !i.is_completed } : i))
    );
    startTransition(async () => {
      try {
        await toggleChecklistItem(id);
      } catch {
        setSortedItems(items); // 롤백
      }
    });
  }

  function handleDelete(id: string) {
    setSortedItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      try {
        await deleteChecklistItem(id);
        toast.success("항목이 삭제되었습니다.");
      } catch {
        setSortedItems(items); // 롤백
        toast.error("삭제에 실패했습니다.");
      }
    });
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      try {
        const item = await addChecklistItem(kickoffId, {
          title: newTitle.trim(),
          assignee_id: newAssignee || undefined,
        });
        setSortedItems((prev) => [...prev, item]);
        setNewTitle("");
        setNewAssignee("");
        setShowAddForm(false);
        toast.success("항목이 추가되었습니다.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "추가에 실패했습니다.");
      }
    });
  }

  const completed = sortedItems.filter((i) => i.is_completed).length;
  const total = sortedItems.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          체크리스트 ({completed}/{total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedItems.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                canEdit={canEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>

        {canEdit && !showAddForm && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-3.5 mr-1" /> 항목 추가
          </Button>
        )}

        {showAddForm && (
          <div className="flex gap-2 items-end border rounded-lg p-3">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="항목명"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />
              <select
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
              >
                <option value="">담당자 선택 (선택)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={handleAdd} disabled={isPending || !newTitle.trim()}>
                추가
              </Button>
              <Button variant="ghost" size="icon" className="size-9" onClick={() => setShowAddForm(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

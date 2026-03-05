"use client";

import { useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { ProjectKickoff, KickoffChecklistItem } from "@/lib/kickoff-constants";

interface KickoffChecklistProps {
  kickoff: ProjectKickoff;
  items: KickoffChecklistItem[];
  users: { id: string; name: string }[];
  currentUserId: string;
  isPM: boolean;
  onUpdate: () => Promise<void>;
}

interface NewItem {
  title: string;
  assignee_id: string;
  due_date: string;
}

// --- Sortable item component ---
function SortableChecklistItem({
  item,
  index,
  totalCount,
  checked,
  canCheck,
  canDeleteItem,
  isPM,
  userMap,
  users,
  onToggle,
  onMove,
  onDelete,
  onAssignee,
  onDueDate,
}: {
  item: KickoffChecklistItem;
  index: number;
  totalCount: number;
  checked: boolean;
  canCheck: boolean;
  canDeleteItem: boolean;
  isPM: boolean;
  userMap: Map<string, string>;
  users: { id: string; name: string }[];
  onToggle: () => void;
  onMove: (idx: number, dir: "up" | "down") => void;
  onDelete: (id: string) => void;
  onAssignee: (id: string, val: string) => void;
  onDueDate: (id: string, val: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isPM });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-2 rounded-lg border p-3 ${
        checked ? "bg-muted/50" : ""
      } ${isDragging ? "z-50 shadow-lg" : ""}`}
    >
      {isPM && (
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}

      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={!canCheck}
      />
      <span
        className={`flex-1 min-w-0 text-sm ${checked ? "line-through text-muted-foreground" : ""}`}
      >
        {item.title}
      </span>

      {item.is_auto_generated && (
        <Badge variant="outline" className="text-[10px]">
          자동
        </Badge>
      )}

      {item.assignee_id && (
        <Badge variant="secondary" className="text-xs">
          {userMap.get(item.assignee_id) ?? "미지정"}
        </Badge>
      )}

      {item.due_date && (
        <span className="text-xs text-muted-foreground">{item.due_date}</span>
      )}

      {isPM && (
        <div className="flex items-center gap-0.5">
          <Select
            value={item.assignee_id ?? ""}
            onValueChange={(v) => onAssignee(item.id, v)}
          >
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <SelectValue placeholder="담당자" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={item.due_date ?? ""}
            onChange={(e) => onDueDate(item.id, e.target.value)}
            className="h-8 w-[130px] text-xs"
          />

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onMove(index, "down")}
            disabled={index === totalCount - 1}
          >
            <ChevronDown className="size-3.5" />
          </Button>

          {canDeleteItem && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main component ---
export function KickoffChecklist({
  kickoff,
  items,
  users,
  currentUserId,
  isPM,
  onUpdate,
}: KickoffChecklistProps) {
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>({ title: "", assignee_id: "", due_date: "" });
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function canCheck(item: KickoffChecklistItem) {
    if (isPM) return true;
    if (!item.assignee_id) return false;
    return item.assignee_id === currentUserId;
  }

  function canDelete(item: KickoffChecklistItem) {
    if (isPM) return true;
    return !item.is_auto_generated;
  }

  async function toggleCheck(item: KickoffChecklistItem) {
    if (!canCheck(item)) return;

    const newChecked = !item.is_completed;
    setOptimistic((prev) => ({ ...prev, [item.id]: newChecked }));

    const { error } = await supabase
      .from("kickoff_checklist_items")
      .update({
        is_completed: newChecked,
        completed_at: newChecked ? new Date().toISOString() : null,
        completed_by: newChecked ? currentUserId : null,
      })
      .eq("id", item.id);

    if (error) {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      toast.error("체크 업데이트 실패");
      return;
    }

    await onUpdate();
    setOptimistic((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  }

  async function addItem() {
    if (!newItem.title.trim()) {
      toast.error("항목 제목을 입력해주세요");
      return;
    }

    const maxOrder = sorted.length > 0 ? sorted[sorted.length - 1].sort_order + 1 : 0;

    const { error } = await supabase.from("kickoff_checklist_items").insert({
      kickoff_id: kickoff.id,
      title: newItem.title.trim(),
      description: "",
      assignee_id: newItem.assignee_id || null,
      due_date: newItem.due_date || null,
      sort_order: maxOrder,
      is_auto_generated: false,
      is_completed: false,
      completed_at: null,
      completed_by: null,
    });

    if (error) {
      toast.error("항목 추가 실패");
      return;
    }

    setNewItem({ title: "", assignee_id: "", due_date: "" });
    setAdding(false);
    await onUpdate();
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from("kickoff_checklist_items").delete().eq("id", id);
    if (error) {
      toast.error("삭제 실패");
      return;
    }
    await onUpdate();
  }

  async function moveItem(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIdx];

    const updates = [
      supabase
        .from("kickoff_checklist_items")
        .update({ sort_order: target.sort_order })
        .eq("id", current.id),
      supabase
        .from("kickoff_checklist_items")
        .update({ sort_order: current.sort_order })
        .eq("id", target.id),
    ];

    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      toast.error("순서 변경 실패");
    }
    await onUpdate();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((item) => item.id === active.id);
    const newIndex = sorted.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sorted, oldIndex, newIndex);

    // Update sort_order for all affected items
    const updates = reordered.map((item, i) =>
      supabase
        .from("kickoff_checklist_items")
        .update({ sort_order: i })
        .eq("id", item.id)
    );

    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      toast.error("순서 변경 실패");
    }
    await onUpdate();
  }

  async function updateAssignee(itemId: string, assigneeId: string) {
    const { error } = await supabase
      .from("kickoff_checklist_items")
      .update({ assignee_id: assigneeId || null })
      .eq("id", itemId);

    if (error) {
      toast.error("담당자 변경 실패");
      return;
    }
    await onUpdate();
  }

  async function updateDueDate(itemId: string, dueDate: string) {
    const { error } = await supabase
      .from("kickoff_checklist_items")
      .update({ due_date: dueDate || null })
      .eq("id", itemId);

    if (error) {
      toast.error("기한 변경 실패");
      return;
    }
    await onUpdate();
  }

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>체크리스트</CardTitle>
          {isPM && (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1 size-4" />
              항목 추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorted.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {sorted.map((item, idx) => {
              const checked = optimistic[item.id] ?? item.is_completed;

              return (
                <SortableChecklistItem
                  key={item.id}
                  item={item}
                  index={idx}
                  totalCount={sorted.length}
                  checked={checked}
                  canCheck={canCheck(item)}
                  canDeleteItem={canDelete(item)}
                  isPM={isPM}
                  userMap={userMap}
                  users={users}
                  onToggle={() => toggleCheck(item)}
                  onMove={moveItem}
                  onDelete={deleteItem}
                  onAssignee={updateAssignee}
                  onDueDate={updateDueDate}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        {adding && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3">
            <Input
              value={newItem.title}
              onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
              placeholder="새 항목 제목"
              className="h-8 flex-1 min-w-[150px] text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <Select
              value={newItem.assignee_id}
              onValueChange={(v) => setNewItem((p) => ({ ...p, assignee_id: v }))}
            >
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue placeholder="담당자" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={newItem.due_date}
              onChange={(e) => setNewItem((p) => ({ ...p, due_date: e.target.value }))}
              className="h-8 w-[140px] text-xs"
            />
            <Button size="sm" onClick={addItem}>
              추가
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              취소
            </Button>
          </div>
        )}

        {sorted.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            체크리스트 항목이 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import type { CarryOverItem } from "@/types/scrum.types";

interface ScrumCarryOverProps {
  items: CarryOverItem[];
  onAdd: (item: CarryOverItem) => void;
  addedIds: Set<string>;
}

export function ScrumCarryOver({ items, onAdd, addedIds }: ScrumCarryOverProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (items.length === 0) return null;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    items
      .filter((i) => selectedIds.has(i.id) && !addedIds.has(i.id))
      .forEach((item) => onAdd(item));
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.filter((i) => !addedIds.has(i.id)).map((i) => i.id)));
  };

  const unadded = items.filter((i) => !addedIds.has(i.id));
  if (unadded.length === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">이월 항목 (어제 미완료)</span>
          <Badge variant="secondary">{unadded.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={selectAll}>
          전체 선택
        </Button>
      </div>
      <div className="space-y-2">
        {unadded.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={selectedIds.has(item.id)}
              onCheckedChange={() => toggleItem(item.id)}
            />
            <span className="text-sm">{item.title}</span>
            <Badge variant="outline" className="text-xs">
              이월
            </Badge>
          </label>
        ))}
      </div>
      {selectedIds.size > 0 && (
        <Button size="sm" onClick={handleAddSelected}>
          {selectedIds.size}건 오늘 이어서 하기
        </Button>
      )}
    </div>
  );
}

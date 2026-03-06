"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, ArrowRight, AlertTriangle, Bot, PenLine } from "lucide-react";
import type { ScrumItem, CarryOverItem, AiMessage } from "@/types/scrum.types";
import { addScrumItem, deleteScrumItem } from "@/actions/scrum";
import { ScrumCarryOver } from "./scrum-carry-over";
import { ScrumAiChat } from "./scrum-ai-chat";

interface ScrumBrainstormProps {
  scrumId: string;
  items: ScrumItem[];
  carryOverItems: CarryOverItem[];
  dueSoonTasks: { id: string; title: string; due_date: string }[];
  todaySchedules: { title: string; start_time: string; end_time: string }[];
  userName: string;
  conversation: AiMessage[];
  onItemsChange: (items: ScrumItem[]) => void;
  onNext: () => void;
  onStart: () => void;
}

export function ScrumBrainstorm({
  scrumId,
  items,
  carryOverItems,
  dueSoonTasks,
  todaySchedules,
  userName,
  conversation,
  onItemsChange,
  onNext,
  onStart,
}: ScrumBrainstormProps) {
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addedCarryOverIds, setAddedCarryOverIds] = useState<Set<string>>(
    new Set(items.filter((i) => i.is_carried_over).map((i) => i.source_task_id ?? ""))
  );

  const handleAdd = useCallback(
    async (title: string, opts?: { is_carried_over?: boolean; source_task_id?: string }) => {
      if (!title.trim()) return;
      setIsAdding(true);
      try {
        onStart();
        const item = await addScrumItem(scrumId, {
          title: title.trim(),
          is_carried_over: opts?.is_carried_over,
          source_task_id: opts?.source_task_id,
        });
        onItemsChange([...items, item]);
      } finally {
        setIsAdding(false);
      }
    },
    [scrumId, items, onItemsChange, onStart]
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      await deleteScrumItem(itemId);
      onItemsChange(items.filter((i) => i.id !== itemId));
    },
    [items, onItemsChange]
  );

  const handleCarryOverAdd = useCallback(
    (co: CarryOverItem) => {
      handleAdd(co.title, {
        is_carried_over: true,
        source_task_id: co.source_task_id ?? undefined,
      });
      setAddedCarryOverIds((prev) => new Set([...prev, co.id]));
    },
    [handleAdd]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd(newTitle);
    setNewTitle("");
  };

  const handleExtractItems = useCallback(
    (text: string) => {
      const lines = text.split("\n");
      const extracted: string[] = [];
      for (const line of lines) {
        const match = line.match(/^[-•*]\s+(.+)/);
        if (match) extracted.push(match[1].trim());
      }
      // Auto-add only when not already added
      const existingTitles = new Set(items.map((i) => i.title));
      extracted
        .filter((t) => !existingTitles.has(t))
        .forEach((title) => handleAdd(title));
    },
    [items, handleAdd]
  );

  const getDDay = (dueDate: string) => {
    const diff = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / 86400000
    );
    return diff === 0 ? "D-Day" : `D-${diff}`;
  };

  return (
    <div className="space-y-4">
      <ScrumCarryOver
        items={carryOverItems}
        onAdd={handleCarryOverAdd}
        addedIds={addedCarryOverIds}
      />

      {dueSoonTasks.length > 0 && (
        <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium">마감 임박 Task</span>
          </div>
          {dueSoonTasks.map((task) => (
            <button
              key={task.id}
              className="flex items-center gap-2 text-sm w-full text-left hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded px-2 py-1 transition-colors"
              onClick={() =>
                handleAdd(task.title, { source_task_id: task.id })
              }
            >
              <Badge variant="outline" className="text-xs shrink-0">
                {getDDay(task.due_date)}
              </Badge>
              <span className="truncate">{task.title}</span>
              <Plus className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
            </button>
          ))}
        </div>
      )}

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="gap-1">
            <Bot className="h-3.5 w-3.5" />
            AI 대화
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-1">
            <PenLine className="h-3.5 w-3.5" />
            자유 입력
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="mt-3">
          <ScrumAiChat
            scrumId={scrumId}
            initialConversation={conversation}
            context={{
              userName,
              carryOverItems: carryOverItems.map((i) => ({ title: i.title })),
              dueSoonTasks: dueSoonTasks.map((t) => ({
                title: t.title,
                due_date: t.due_date,
              })),
              todaySchedules,
            }}
            onExtractItems={handleExtractItems}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="할 일을 입력하세요..."
              disabled={isAdding}
            />
            <Button type="submit" size="sm" disabled={!newTitle.trim() || isAdding}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            오늘의 할 일 ({items.length}건)
          </p>
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <span className="text-sm flex-1 truncate">{item.title}</span>
                {item.is_carried_over && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    이월
                  </Badge>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={items.length === 0}>
          다음: 우선순위
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

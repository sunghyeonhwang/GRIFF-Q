"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskDetailPanel } from "./task-detail-panel";
import { reorderTasks } from "@/actions/task";
import {
  type Task,
  type TaskStatus,
  TASK_STATUS_CONFIG,
  KANBAN_COLUMNS,
} from "@/types/task.types";
import { toast } from "sonner";
import { CalendarDays, GripVertical, User } from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
}

interface TaskBoardProps {
  tasks: Task[];
  users: UserInfo[];
}

// ─── Column header color map ───
const columnColorMap: Record<string, string> = {
  gray: "border-t-gray-400",
  blue: "border-t-blue-500",
  yellow: "border-t-yellow-500",
  green: "border-t-green-500",
  red: "border-t-red-500",
};

// ─── Sortable Task Card ───
function SortableTaskCard({
  task,
  onClickCard,
}: {
  task: Task;
  onClickCard: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow group"
        onClick={() => onClickCard(task)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-1.5">
            <button
              className="mt-0.5 cursor-grab opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-3.5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium leading-tight line-clamp-2 flex-1">
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TaskPriorityBadge priority={task.priority} />
            {task.labels?.slice(0, 2).map((l) => (
              <Badge key={l} variant="secondary" className="text-[10px]">
                {l}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {task.assignee?.name ?? "미배정"}
            </span>
            {task.due_date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {new Date(task.due_date).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Drag Overlay Card ───
function DragOverlayCard({ task }: { task: Task }) {
  return (
    <Card className="shadow-lg border-brand/50 rotate-2">
      <CardContent className="p-3 space-y-2">
        <span className="text-sm font-medium line-clamp-2">{task.title}</span>
        <TaskPriorityBadge priority={task.priority} />
      </CardContent>
    </Card>
  );
}

// ─── Kanban Column ───
function KanbanColumn({
  status,
  tasks,
  onClickCard,
}: {
  status: TaskStatus;
  tasks: Task[];
  onClickCard: (task: Task) => void;
}) {
  const config = TASK_STATUS_CONFIG[status];
  const borderColor = columnColorMap[config.color] ?? "border-t-gray-400";

  return (
    <div className="flex flex-col min-w-[260px] w-full">
      {/* Column header */}
      <div
        className={`rounded-t-lg border-t-2 ${borderColor} bg-muted/50 px-3 py-2 flex items-center gap-2`}
      >
        <h3 className="text-sm font-medium">{config.label}</h3>
        <Badge variant="outline" className="text-xs">
          {tasks.length}
        </Badge>
      </div>

      {/* Cards */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2 p-2 rounded-b-lg border border-t-0 bg-muted/20 min-h-[120px]">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClickCard={onClickCard}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full min-h-[80px] text-xs text-muted-foreground border border-dashed rounded-md">
              Task 없음
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Board ───
export function TaskBoard({ tasks: initialTasks, users }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Group tasks by status
  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      review: [],
      completed: [],
      issue: [],
    };
    tasks
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((t) => {
        map[t.status]?.push(t);
      });
    return map;
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) ?? null,
    [tasks, activeId],
  );

  // Find which column a task belongs to
  const findColumn = useCallback(
    (id: string): TaskStatus | null => {
      const task = tasks.find((t) => t.id === id);
      if (task) return task.status;
      // Check if id is a column key (for over events on empty columns)
      if (KANBAN_COLUMNS.includes(id as TaskStatus)) return id as TaskStatus;
      return null;
    },
    [tasks],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findColumn(active.id as string);
    let overCol = findColumn(over.id as string);

    // If dropping over a column container (not a card)
    if (!overCol && KANBAN_COLUMNS.includes(over.id as TaskStatus)) {
      overCol = over.id as TaskStatus;
    }

    if (!activeCol || !overCol || activeCol === overCol) return;

    // Move task to new column
    setTasks((prev) =>
      prev.map((t) =>
        t.id === active.id ? { ...t, status: overCol as TaskStatus } : t,
      ),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);

    if (!activeCol || !overCol) return;

    setTasks((prev) => {
      let updated = [...prev];

      // If same column, reorder
      if (activeCol === overCol) {
        const colTasks = updated
          .filter((t) => t.status === activeCol)
          .sort((a, b) => a.sort_order - b.sort_order);

        const oldIndex = colTasks.findIndex((t) => t.id === active.id);
        const newIndex = colTasks.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(colTasks, oldIndex, newIndex);
          const sortMap = new Map(
            reordered.map((t, i) => [t.id, i]),
          );

          updated = updated.map((t) => {
            const newOrder = sortMap.get(t.id);
            if (newOrder !== undefined) {
              return { ...t, sort_order: newOrder };
            }
            return t;
          });
        }
      }

      // Persist to server
      const updatedForServer = updated
        .filter(
          (t) =>
            t.status !== initialTasks.find((it) => it.id === t.id)?.status ||
            t.sort_order !==
              initialTasks.find((it) => it.id === t.id)?.sort_order,
        )
        .map((t) => ({
          id: t.id,
          status: t.status,
          sort_order: t.sort_order,
        }));

      if (updatedForServer.length > 0) {
        reorderTasks(updatedForServer).catch(() => {
          toast.error("정렬 저장 실패");
          setTasks(initialTasks);
        });
      }

      return updated;
    });
  }

  function openDetail(task: Task) {
    setSelectedTask(task);
    setDetailOpen(true);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onClickCard={openDetail}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <DragOverlayCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailPanel
        task={selectedTask}
        users={users}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

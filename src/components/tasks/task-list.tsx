"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusSelect } from "./task-status-select";
import { TaskDetailPanel } from "./task-detail-panel";
import type { Task } from "@/types/task.types";

interface User {
  id: string;
  name: string;
}

interface TaskListProps {
  tasks: Task[];
  users: User[];
}

export function TaskList({ tasks, users }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function openDetail(task: Task) {
    setSelectedTask(task);
    setDetailOpen(true);
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">우선순위</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-[140px]">상태</TableHead>
              <TableHead className="w-[100px]">담당자</TableHead>
              <TableHead className="w-[100px]">마감일</TableHead>
              <TableHead className="w-[60px] text-center">가중치</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Task가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetail(task)}
                >
                  <TableCell>
                    <TaskPriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <TaskStatusSelect
                      taskId={task.id}
                      currentStatus={task.status}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.assignee?.name ?? "미배정"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString("ko-KR")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {task.weight}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDetailPanel
        task={selectedTask}
        users={users}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

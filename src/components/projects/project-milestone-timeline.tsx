"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Check,
  Circle,
  Pencil,
  X,
  Milestone,
} from "lucide-react";
import { toast } from "sonner";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/actions/project";
import type { ProjectMilestone } from "@/types/project.types";

interface ProjectMilestoneTimelineProps {
  projectId: string;
  milestones: ProjectMilestone[];
}

export function ProjectMilestoneTimeline({
  projectId,
  milestones: initialMilestones,
}: ProjectMilestoneTimelineProps) {
  const [milestones, setMilestones] =
    useState<ProjectMilestone[]>(initialMilestones);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!newTitle.trim()) {
      toast.error("마일스톤 제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const milestone = await createMilestone(projectId, {
        title: newTitle,
        due_date: newDueDate || undefined,
      });
      setMilestones((prev) => [...prev, milestone]);
      setNewTitle("");
      setNewDueDate("");
      setShowAdd(false);
      toast.success("마일스톤이 추가되었습니다.");
    } catch (error) {
      toast.error("마일스톤 추가 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(milestone: ProjectMilestone) {
    const newStatus =
      milestone.status === "completed" ? "pending" : "completed";
    try {
      const updated = await updateMilestone(milestone.id, {
        status: newStatus,
      });
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestone.id ? updated : m))
      );
    } catch {
      toast.error("상태 변경 실패");
    }
  }

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) return;

    try {
      const updated = await updateMilestone(id, {
        title: editTitle,
        due_date: editDueDate || null,
      });
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? updated : m))
      );
      setEditingId(null);
      toast.success("마일스톤이 수정되었습니다.");
    } catch {
      toast.error("수정 실패");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMilestone(id);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      toast.success("마일스톤이 삭제되었습니다.");
    } catch {
      toast.error("삭제 실패");
    }
  }

  function startEdit(milestone: ProjectMilestone) {
    setEditingId(milestone.id);
    setEditTitle(milestone.title);
    setEditDueDate(milestone.due_date || "");
  }

  const sortedMilestones = [...milestones].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Milestone className="size-4" />
          마일스톤 ({milestones.length})
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="mr-1 size-3" />
          추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* 추가 폼 */}
        {showAdd && (
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50 mb-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="마일스톤 제목"
              className="flex-1 h-8"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-[150px] h-8"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={loading || !newTitle.trim()}
              className="h-8"
            >
              추가
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAdd(false);
                setNewTitle("");
                setNewDueDate("");
              }}
              className="h-8"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* 타임라인 */}
        {sortedMilestones.length > 0 ? (
          <div className="relative">
            {/* 타임라인 라인 */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-1">
              {sortedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="relative flex items-start gap-3 py-2 group"
                >
                  {/* 상태 아이콘 */}
                  <button
                    onClick={() => handleToggleStatus(milestone)}
                    className="relative z-10 mt-0.5 shrink-0"
                    title={
                      milestone.status === "completed"
                        ? "미완료로 변경"
                        : "완료로 변경"
                    }
                  >
                    {milestone.status === "completed" ? (
                      <div className="size-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="size-3 text-white" />
                      </div>
                    ) : (
                      <div className="size-6 rounded-full border-2 border-muted-foreground/30 bg-background flex items-center justify-center hover:border-primary transition-colors">
                        <Circle className="size-2 text-muted-foreground/50" />
                      </div>
                    )}
                  </button>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    {editingId === milestone.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 h-7 text-sm"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleUpdate(milestone.id)
                          }
                        />
                        <Input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-[140px] h-7 text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => handleUpdate(milestone.id)}
                        >
                          <Check className="size-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              milestone.status === "completed"
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {milestone.title}
                          </span>
                          {milestone.due_date && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {new Date(milestone.due_date).toLocaleDateString(
                                "ko-KR",
                                { month: "short", day: "numeric" }
                              )}
                            </Badge>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => startEdit(milestone)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(milestone.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            마일스톤이 없습니다. &quot;추가&quot; 버튼을 클릭하여 추가하세요.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

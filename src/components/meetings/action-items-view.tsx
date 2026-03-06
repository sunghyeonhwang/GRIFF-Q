"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LoadingButton } from "@/components/ui/loading-button";
import { promoteActionItemToTask } from "@/actions/task";
import { toast } from "sonner";
import {
  ArrowUpFromLine,
  CheckCircle,
  Circle,
  Clock,
  ListChecks,
} from "lucide-react";

interface ActionItem {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  note: string | null;
  meeting_id: string;
  meeting_title: string;
  assignee_name: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface ActionItemsViewProps {
  actionItems: ActionItem[];
  projects?: ProjectOption[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  in_progress: "secondary",
  completed: "default",
};

export function ActionItemsView({ actionItems, projects = [] }: ActionItemsViewProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isPromoting, startPromoteTransition] = useTransition();

  // Extract unique assignee names for filter dropdown
  const assigneeNames = useMemo(() => {
    const names = new Set<string>();
    for (const ai of actionItems) {
      if (ai.assignee_name) names.add(ai.assignee_name);
    }
    return Array.from(names).sort();
  }, [actionItems]);

  const filtered = useMemo(() => {
    let result = actionItems;
    if (statusFilter !== "all") {
      result = result.filter((ai) => ai.status === statusFilter);
    }
    if (assigneeFilter !== "all") {
      result = result.filter((ai) => ai.assignee_name === assigneeFilter);
    }
    return result;
  }, [actionItems, statusFilter, assigneeFilter]);

  const total = actionItems.length;
  const pending = actionItems.filter((ai) => ai.status === "pending").length;
  const inProgress = actionItems.filter((ai) => ai.status === "in_progress").length;
  const completed = actionItems.filter((ai) => ai.status === "completed").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  function openPromoteDialog(item: ActionItem) {
    setSelectedActionItem(item);
    setSelectedProjectId("");
    setPromoteDialogOpen(true);
  }

  function handlePromote() {
    if (!selectedActionItem || !selectedProjectId) {
      toast.error("프로젝트를 선택해주세요.");
      return;
    }

    startPromoteTransition(async () => {
      try {
        await promoteActionItemToTask(selectedActionItem.id, selectedProjectId);
        toast.success(`"${selectedActionItem.title}"이(가) Task로 승격되었습니다.`);
        setPromoteDialogOpen(false);
        setSelectedActionItem(null);
        router.refresh();
      } catch {
        toast.error("Task 승격 실패");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <ListChecks className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">대기</CardTitle>
            <Circle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">진행중</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">전체 완료율</span>
            <span className="text-sm text-muted-foreground">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Filter tabs + assignee filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">전체 ({total})</TabsTrigger>
            <TabsTrigger value="pending">대기 ({pending})</TabsTrigger>
            <TabsTrigger value="in_progress">진행중 ({inProgress})</TabsTrigger>
            <TabsTrigger value="completed">완료 ({completed})</TabsTrigger>
          </TabsList>
        </Tabs>
        {assigneeNames.length > 0 && (
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="담당자 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 담당자</SelectItem>
              {assigneeNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>항목</TableHead>
              <TableHead>회의록</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>마감일</TableHead>
              <TableHead>상태</TableHead>
              {projects.length > 0 && <TableHead className="w-[80px]">액션</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={projects.length > 0 ? 6 : 5}
                  className="py-8 text-center text-muted-foreground"
                >
                  해당하는 액션아이템이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const isOverdue =
                  item.due_date &&
                  item.status !== "completed" &&
                  new Date(item.due_date) < new Date();
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Link
                        href={`/meetings/${item.meeting_id}`}
                        className="text-sm hover:underline"
                      >
                        {item.meeting_title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.assignee_name || "-"}
                    </TableCell>
                    <TableCell>
                      {item.due_date ? (
                        <span
                          className={
                            isOverdue ? "text-destructive font-medium" : ""
                          }
                        >
                          {new Date(item.due_date).toLocaleDateString("ko-KR")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[item.status] ?? "outline"}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                    {projects.length > 0 && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => openPromoteDialog(item)}
                          title="Task로 승격"
                        >
                          <ArrowUpFromLine className="size-3" />
                          승격
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Promote to Task Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Task로 승격</DialogTitle>
            <DialogDescription>
              {selectedActionItem && (
                <>
                  &quot;{selectedActionItem.title}&quot;을(를) Task로 승격합니다.
                  <br />
                  대상 프로젝트를 선택해주세요.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="프로젝트 선택" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPromoteDialogOpen(false)}
              disabled={isPromoting}
            >
              취소
            </Button>
            <LoadingButton
              loading={isPromoting}
              onClick={handlePromote}
              disabled={!selectedProjectId}
            >
              승격
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

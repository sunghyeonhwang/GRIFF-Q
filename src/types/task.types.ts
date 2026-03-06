export type TaskStatus = "pending" | "in_progress" | "review" | "completed" | "issue";
export type TaskPriority = "urgent" | "high" | "normal" | "low";
export type TaskSource = "manual" | "meeting" | "scrum" | "kickoff" | "template";
export type DependencyType = "finish_to_start" | "start_to_start" | "finish_to_finish";

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  weight: number;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  parent_task_id: string | null;
  milestone_id: string | null;
  source: TaskSource;
  source_id: string | null;
  labels: string[];
  sort_order: number;
  node_position_x: number;
  node_position_y: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  assignee?: { name: string; email: string };
  subtasks?: Task[];
  dependencies?: TaskDependency[];
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_id: string;
  dependency_type: DependencyType;
  created_at: string;
}

export interface TaskWithDeps extends Task {
  blocked_by: Task[];
  blocks: Task[];
}

// Task 상태 설정
export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "대기", color: "gray", icon: "Circle" },
  in_progress: { label: "진행중", color: "blue", icon: "Timer" },
  review: { label: "리뷰", color: "yellow", icon: "Eye" },
  completed: { label: "완료", color: "green", icon: "CheckCircle2" },
  issue: { label: "이슈", color: "red", icon: "AlertTriangle" },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; order: number }> = {
  urgent: { label: "긴급", color: "red", order: 0 },
  high: { label: "높음", color: "orange", order: 1 },
  normal: { label: "보통", color: "blue", order: 2 },
  low: { label: "낮음", color: "gray", order: 3 },
};

// Kanban 컬럼 순서
export const KANBAN_COLUMNS: TaskStatus[] = [
  "pending",
  "in_progress",
  "review",
  "completed",
  "issue",
];

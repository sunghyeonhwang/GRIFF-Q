export type ScrumStatus =
  | "not_started"
  | "brainstorming"
  | "prioritizing"
  | "scheduling"
  | "completed"
  | "skipped";

export type ScrumItemPriority = "urgent" | "important" | "normal" | "later";
export type ScrumItemStatus = "planned" | "completed" | "skipped";

export interface DailyScrum {
  id: string;
  user_id: string;
  scrum_date: string;
  status: ScrumStatus;
  skip_reason: string | null;
  ai_conversation: AiMessage[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrumItem {
  id: string;
  scrum_id: string;
  title: string;
  priority: ScrumItemPriority;
  priority_order: number;
  time_block_start: string | null;
  time_block_end: string | null;
  estimated_minutes: number;
  is_carried_over: boolean;
  source_task_id: string | null;
  generated_task_id: string | null;
  status: ScrumItemStatus;
  sort_order: number;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CarryOverItem {
  id: string;
  title: string;
  source_task_id: string | null;
  original_scrum_date: string;
}

export const SCRUM_STEP_CONFIG = {
  brainstorming: { step: 1, label: "브레인스토밍", description: "오늘 뭘 해야 하지?" },
  prioritizing: { step: 2, label: "우선순위", description: "뭐가 더 급하지?" },
  scheduling: { step: 3, label: "시간 배치", description: "언제 하지?" },
} as const;

export const PRIORITY_CONFIG: Record<
  ScrumItemPriority,
  { label: string; color: string; bgColor: string }
> = {
  urgent: { label: "긴급", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  important: { label: "중요", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  normal: { label: "일반", color: "text-muted-foreground", bgColor: "bg-muted" },
  later: { label: "후순위", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
};

export const ESTIMATED_TIME_OPTIONS = [
  { value: 15, label: "15분" },
  { value: 30, label: "30분" },
  { value: 60, label: "1시간" },
  { value: 120, label: "2시간" },
  { value: 240, label: "반나절" },
] as const;

export const SKIP_REASONS = ["외근", "휴가", "회의 밀집", "기타"] as const;

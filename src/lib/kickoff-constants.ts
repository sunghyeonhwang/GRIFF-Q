export const KICKOFF_STATUS = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
} as const;

export type KickoffStatus = (typeof KICKOFF_STATUS)[keyof typeof KICKOFF_STATUS];

export const KICKOFF_STATUS_LABELS: Record<KickoffStatus, string> = {
  draft: "초안",
  in_progress: "진행중",
  on_hold: "보류",
  completed: "완료",
};

export const KICKOFF_STATUS_VARIANTS: Record<KickoffStatus, "outline" | "default" | "secondary" | "destructive"> = {
  draft: "outline",
  in_progress: "default",
  on_hold: "destructive",
  completed: "secondary",
};

// Primary CTA button config per status
export const KICKOFF_CTA_CONFIG: Record<KickoffStatus, { label: string; variant: "default" | "outline"; nextStatus: KickoffStatus | null }> = {
  draft: { label: "킥오프 시작", variant: "default", nextStatus: "in_progress" },
  in_progress: { label: "킥오프 완료", variant: "default", nextStatus: "completed" },
  on_hold: { label: "킥오프 재개", variant: "default", nextStatus: "in_progress" },
  completed: { label: "킥오프 재개", variant: "outline", nextStatus: "in_progress" },
};

// Secondary action per status (보류)
export const KICKOFF_SECONDARY_CTA: Partial<Record<KickoffStatus, { label: string; variant: "outline" | "destructive"; nextStatus: KickoffStatus }>> = {
  in_progress: { label: "보류", variant: "outline", nextStatus: "on_hold" },
};

// Types
export interface ProjectKickoff {
  id: string;
  project_id: string;
  objective: string;
  scope: string;
  constraints: string;
  success_criteria: string;
  notes: string;
  kickoff_date: string | null;
  status: KickoffStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KickoffChecklistItem {
  id: string;
  kickoff_id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  due_date: string | null;
  sort_order: number;
  is_auto_generated: boolean;
  created_at: string;
}

export interface KickoffAcknowledgment {
  id: string;
  kickoff_id: string;
  user_id: string;
  acknowledged_at: string;
}

export interface KickoffAiConversation {
  id: string;
  kickoff_id: string;
  user_id: string;
  messages: { role: "user" | "assistant"; content: string; timestamp: string }[];
  created_at: string;
  updated_at: string;
}

export interface AiSuggestion {
  label: string;
  action: "add_checklist" | "add_notes" | "create_tasks" | "ignore";
  data: any;
}

export interface AiRisk {
  level: "low" | "medium" | "high";
  title: string;
  description: string;
  recommendation: string;
  source_project: string;
}

export type ReviewType = "weekly" | "monthly" | "on_demand";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ProjectReview {
  id: string;
  project_id: string;
  review_type: ReviewType;
  generated_by: string;
  summary: string | null;
  report_content: ReviewReportContent;
  risk_level: RiskLevel;
  recommendations: ReviewRecommendation[];
  created_at: string;
}

export interface ReviewReportContent {
  executive_summary: string;
  progress_overview: {
    total_tasks: number;
    completed: number;
    in_progress: number;
    delayed: number;
    completion_rate: number;
  };
  completed_this_period: string[];
  in_progress_items: string[];
  delayed_items: { title: string; reason: string; impact: string }[];
  risks: { description: string; level: RiskLevel; mitigation: string }[];
  next_period_plan: string[];
}

export interface ReviewRecommendation {
  type: "resource" | "schedule" | "scope" | "risk";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface ReviewConversation {
  id: string;
  project_id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; icon: string }> = {
  low: { label: "낮음", color: "green", icon: "Shield" },
  medium: { label: "보통", color: "yellow", icon: "ShieldAlert" },
  high: { label: "높음", color: "orange", icon: "ShieldX" },
  critical: { label: "심각", color: "red", icon: "ShieldOff" },
};

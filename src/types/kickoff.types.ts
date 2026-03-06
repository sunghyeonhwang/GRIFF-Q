export interface ProjectKickoff {
  id: string;
  project_id: string;
  objective: string | null;
  scope: string | null;
  constraints: string | null;
  success_criteria: string | null;
  kickoff_date: string | null;
  meeting_notes: string | null;
  meeting_attendees: string[];
  meeting_decisions: MeetingDecision[];
  status: KickoffStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type KickoffStatus = "draft" | "in_progress" | "completed";

export interface MeetingDecision {
  title: string;
  content: string;
}

export interface KickoffChecklistItem {
  id: string;
  kickoff_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  is_completed: boolean;
  due_date: string | null;
  sort_order: number;
  created_at: string;
  // joined
  assignee?: { name: string } | null;
}

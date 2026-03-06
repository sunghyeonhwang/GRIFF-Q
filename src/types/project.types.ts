export type ProjectType = "general" | "event" | "content" | "maintenance";

export interface Project {
  id: string;
  name: string;
  status: "active" | "completed" | "on_hold";
  project_type: ProjectType;
  priority: number;
  progress: number;
  color: string;
  archived: boolean;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  lead_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectRole =
  | "pm"
  | "planner"
  | "designer"
  | "developer"
  | "video"
  | "operations"
  | "allrounder";

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  is_backup: boolean;
  joined_at: string;
  user?: { name: string; email: string };
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  status: "pending" | "completed";
  sort_order: number;
}

// 프로젝트 종류별 기본 R&R 템플릿
export const PROJECT_ROLE_TEMPLATES: Record<ProjectType, ProjectRole[]> = {
  general: ["pm", "designer", "developer"],
  event: ["pm", "planner", "designer", "video", "operations"],
  content: ["pm", "planner", "designer", "video"],
  maintenance: ["pm", "developer"],
};

// 프로젝트 종류별 기본 임무카드 (Task 템플릿)
export const PROJECT_TASK_TEMPLATES: Record<ProjectType, { title: string; weight: number }[]> = {
  general: [
    { title: "기획 문서 작성", weight: 2 },
    { title: "디자인 시안", weight: 2 },
    { title: "개발", weight: 3 },
    { title: "QA 테스트", weight: 1 },
    { title: "배포", weight: 1 },
  ],
  event: [
    { title: "행사 기획서", weight: 2 },
    { title: "장소/일정 확정", weight: 2 },
    { title: "홍보물 제작", weight: 2 },
    { title: "영상 제작", weight: 2 },
    { title: "현장 운영", weight: 3 },
    { title: "결과 보고서", weight: 1 },
  ],
  content: [
    { title: "콘텐츠 기획", weight: 2 },
    { title: "콘텐츠 제작", weight: 3 },
    { title: "편집/수정", weight: 2 },
    { title: "발행", weight: 1 },
  ],
  maintenance: [
    { title: "이슈 분석", weight: 1 },
    { title: "수정 개발", weight: 2 },
    { title: "테스트", weight: 1 },
    { title: "배포", weight: 1 },
  ],
};

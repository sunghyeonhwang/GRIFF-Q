import { KickoffChecklistItem } from "./kickoff-constants";

export type ProjectType = "general" | "event" | "content" | "maintenance";

interface ChecklistTemplate {
  title: string;
  description: string;
}

const CHECKLIST_TEMPLATES: Record<ProjectType, ChecklistTemplate[]> = {
  general: [
    { title: "기획안 확정", description: "프로젝트 기획안 최종 검토 및 확정" },
    { title: "일정표 공유", description: "전체 일정표를 팀원에게 공유" },
    { title: "R&R 확인", description: "역할과 책임 분담 확인" },
    { title: "커뮤니케이션 채널 설정", description: "슬랙/카카오톡 등 소통 채널 생성" },
  ],
  event: [
    { title: "장소 확정", description: "행사 장소 예약 및 확정" },
    { title: "장비 리스트 확인", description: "필요 장비 목록 작성 및 확보" },
    { title: "비상 연락망", description: "비상 연락망 작성 및 공유" },
    { title: "동선 확인", description: "행사 동선 및 배치도 확인" },
    { title: "리허설 일정", description: "리허설 일정 확정 및 공유" },
  ],
  content: [
    { title: "레퍼런스 수집", description: "참고 자료 및 레퍼런스 수집" },
    { title: "스크립트 초안", description: "콘텐츠 스크립트 초안 작성" },
    { title: "촬영 일정", description: "촬영 일정 확정" },
    { title: "편집 도구 확인", description: "편집 도구 및 환경 확인" },
  ],
  maintenance: [
    { title: "SLA 확인", description: "서비스 수준 협약(SLA) 확인" },
    { title: "에스컬레이션 라인", description: "문제 발생 시 에스컬레이션 경로 정의" },
    { title: "모니터링 도구", description: "모니터링 도구 설정 및 접근 확인" },
    { title: "복구 절차", description: "장애 복구 절차 문서화" },
  ],
};

export function generateChecklistItems(
  projectType: string | null,
  kickoffId: string
): Omit<KickoffChecklistItem, "id" | "created_at">[] {
  const type = (projectType as ProjectType) || "general";
  const templates = CHECKLIST_TEMPLATES[type] || CHECKLIST_TEMPLATES.general;

  return templates.map((t, index) => ({
    kickoff_id: kickoffId,
    title: t.title,
    description: t.description,
    assignee_id: null,
    is_completed: false,
    completed_at: null,
    completed_by: null,
    due_date: null,
    sort_order: index,
    is_auto_generated: true,
  }));
}

export function getAvailableProjectTypes(): { value: ProjectType; label: string }[] {
  return [
    { value: "general", label: "일반" },
    { value: "event", label: "이벤트/행사" },
    { value: "content", label: "콘텐츠 제작" },
    { value: "maintenance", label: "유지보수" },
  ];
}

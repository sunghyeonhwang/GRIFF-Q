export const ROLES = [
  "디자인",
  "인쇄",
  "웹사이트 제작",
  "브랜딩",
  "촬영",
  "중계",
  "라이브 중계",
  "사진촬영",
  "진행",
  "홍보",
  "PR",
] as const;

export type RetroRole = (typeof ROLES)[number];

// 파트별 평가 대상 (엑셀 시트 기반 + 현재 시스템 역할 통합)
export const EVALUATION_PARTS = [
  "기획 (컨텐츠)",
  "기획 (일정)",
  "메인 디자인",
  "서브 디자인 (출력물 등)",
  "현장 답사",
  "커뮤니케이션",
  "웹사이트 디자인",
  "현장 진행",
  "영상",
  "중계",
  "기타",
] as const;

export type EvaluationPart = (typeof EVALUATION_PARTS)[number];

// 프로젝트 만족도 항목
export const SATISFACTION_ITEMS = [
  { key: "client", label: "클라이언트 만족도" },
  { key: "team", label: "내부 팀 만족도" },
  { key: "schedule", label: "일정 준수율" },
  { key: "budget", label: "예산 준수율" },
  { key: "quality", label: "결과물 품질" },
  { key: "communication", label: "커뮤니케이션 원활도" },
] as const;

export type SatisfactionKey = (typeof SATISFACTION_ITEMS)[number]["key"];

// 점수 라벨
export const SCORE_LABELS: Record<number, string> = {
  1: "매우 미흡",
  2: "미흡",
  3: "보통",
  4: "우수",
  5: "매우 우수",
};

// 파트별 평가 단일 항목
export interface PartEvaluation {
  part: string;
  score: number;
  good: string;
  bad: string;
  reason: string;
  improvement: string;
}

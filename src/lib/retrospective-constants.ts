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

export const BANKS = [
  "KB국민",
  "신한",
  "하나",
  "우리",
  "NH농협",
  "IBK기업",
  "SC제일",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "새마을금고",
  "우체국",
  "수협",
  "대구",
  "부산",
  "경남",
  "광주",
  "전북",
  "제주",
] as const;

export type Bank = (typeof BANKS)[number];

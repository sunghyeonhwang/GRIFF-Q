# GRIFF-Q 0.1 개발 로그

---

## P0 — 프로젝트 초기화 + Auth + 레이아웃

**상태**: ✅ 완료
**커밋**: `1e68b76` (2026-02-25)

### 작업 내역
- Next.js 16 프로젝트 초기화 (App Router, TypeScript, Tailwind CSS v4)
- Supabase 연동 클라이언트 구성
  - `src/lib/supabase/client.ts` — 브라우저 클라이언트
  - `src/lib/supabase/server.ts` — 서버 클라이언트 (쿠키 처리)
  - `src/lib/supabase/middleware.ts` — 미들웨어 세션 관리
  - `src/lib/supabase/admin.ts` — 서비스 롤 클라이언트
- 인증 시스템
  - 이메일+비밀번호 로그인 (`/login`)
  - 4단계 권한 체계: super / boss / manager / normal
  - `src/lib/auth.ts` — getUser, requireAuth, requireRole 헬퍼
  - `src/types/auth.types.ts` — UserRole, UserProfile, hasMinimumRole
  - `src/middleware.ts` — 인증 체크 + 리다이렉트
- 대시보드 레이아웃
  - `src/components/layout/app-sidebar.tsx` — 역할 기반 메뉴 필터링 사이드바
  - `src/components/layout/app-header.tsx` — 헤더 (SidebarTrigger)
  - `src/app/(dashboard)/layout.tsx` — SidebarProvider 래퍼
- DB 마이그레이션
  - `supabase/migrations/001_init.sql` — users 테이블, RLS, user_role enum, 트리거
- 시드 데이터
  - `scripts/seed-users.ts` — 7명 팀 계정 생성 (Supabase Auth + public.users)
- shadcn/ui 컴포넌트 12종 설치

### 이슈 & 해결
- **handle_new_user 트리거 충돌**: `auth.admin.createUser()` 호출 시 트리거가 500 에러 유발 → 트리거 드롭 후 수동 INSERT 방식으로 시드 스크립트 수정, 이후 트리거 복원
- **DB 비밀번호 대소문자**: `Good121930pc8500` → `good121930pc8500` (소문자)로 수정
- **DB 연결 엔드포인트**: `aws-0-ap-northeast-2` (Seoul) 실패 → `aws-1-ap-northeast-1` (Japan pooler, port 6543) 성공

### 테스트
- Playwright: 로그인 → 대시보드 진입 → 사이드바 메뉴 렌더링 확인 ✅

---

## P1 — 회고 시스템

**상태**: ✅ 완료
**커밋**: `53c0679` (2026-02-25)

### 작업 내역
- DB 마이그레이션
  - `supabase/migrations/002_retrospectives.sql` — projects, retrospectives, retrospective_summaries 테이블 + RLS 정책
- 회고 목록 페이지 `/retrospective`
  - 프로젝트별 취합 뷰 바로가기 (Badge 링크)
  - 전체 회고 테이블 (프로젝트, 작성자, 역할, 상태, 작성일)
- 회고 작성 `/retrospective/new`
  - KPT (Keep / Problem / Try) + SSC (Start / Stop / Continue) 프레임워크
  - 프로젝트 선택 + 새 프로젝트 생성 다이얼로그
  - 역할 복수 선택 (11종: 디자인, 인쇄, 웹사이트 제작 등)
  - 동적 리스트 항목 추가/삭제
  - 임시 저장 (Draft) / 제출 (Submitted) 분리
  - 제출 확인 다이얼로그
  - 공유 메모: 팀 공유 포인트 + 다음 프로젝트 반영 사항
- 회고 수정/상세 `/retrospective/[id]`
  - Draft 상태 또는 super/boss만 수정 가능
  - 그 외 읽기 전용
- 프로젝트별 취합 뷰 `/retrospective/summary/[projectId]`
  - 탭 3개: 참여 현황 / 통합 인사이트 / 역할별 요약
  - 참여 현황: 전체 사용자 대비 제출 현황 테이블
  - 통합 인사이트: Keep+Continue / Problem+Stop / Try+Start 자동 묶기
  - 역할별 요약: 역할별 핵심 이슈 + 다음 액션 테이블
- 컴포넌트
  - `src/components/retrospective/retrospective-form.tsx` — 메인 폼 (클라이언트)
  - `src/lib/retrospective-constants.ts` — ROLES 상수

### 이슈 & 해결
- 없음 (P0에서 DB 연결 이슈 해결 완료 상태)

### 테스트
- Playwright: 로그인 → 회고 페이지 진입 → 프로젝트 생성 → 폼 작성 (KPT+SSC 전체) → 제출 → 목록 반영 확인 → 취합 뷰 탭 전환 확인 ✅

---

## 추가 작업 — 다크모드 + v0.2 로드맵 업데이트

**상태**: 🔧 작업 완료 (미커밋)
**날짜**: 2026-02-26

### 작업 내역
- `next-themes` 패키지 설치
- `src/components/theme-provider.tsx` — ThemeProvider 래퍼
- `src/components/theme-toggle.tsx` — 해/달 아이콘 테마 전환 버튼
- `src/app/layout.tsx` — ThemeProvider 적용, suppressHydrationWarning 추가
- `src/components/layout/app-header.tsx` — 헤더 오른쪽에 테마 토글 배치
- 시스템 테마 자동 감지 (기본값) + 수동 전환 지원
- v0.2 로드맵에 "프로젝트 리뷰" 기능 추가 (SITEMAP.md, GRIFF-Q-0.1-spec.md)

---

## P2 — 대시보드

**상태**: ✅ 완료
**날짜**: 2026-02-26

### 작업 내역
- 대시보드 실데이터 연동 (기존 스켈레톤 → 실 Supabase 쿼리)
- 요약 카드 4종: 마감 임박 / 입금 대기 / 최근 회의 / 회고 제출 (아이콘 포함)
- 하단 위젯 4종:
  - 마감 임박 액션아이템 (7일 이내, 미완료)
  - 대기 중인 입금 요청 (금액, 마감일)
  - 최근 회의록 (링크 카드)
  - 회고 제출 현황 (프로젝트별 프로그레스 바, n/총원)

### 테스트
- Playwright: 대시보드 진입 → 4종 카드 수치 확인 → 하단 위젯 데이터 반영 확인 ✅

---

## P3 — 회의록 관리

**상태**: ✅ 완료
**날짜**: 2026-02-26

### 작업 내역
- DB 마이그레이션
  - `supabase/migrations/003_meetings.sql` — meetings, action_items 테이블, action_item_status enum, RLS 정책
- 회의록 목록 `/meetings`
  - 테이블 뷰 (제목, 날짜, 참석자, 액션아이템 완료율, 작성자)
  - 참석자 이름 표시 (uuid → 이름 매핑)
  - 액션아이템 건수 배지 (완료/전체)
- 회의록 작성 `/meetings/new`
  - 제목, 날짜, 참석자(체크박스), 내용(Textarea)
  - 액션아이템: 동적 추가/삭제, 항목명/담당자/마감일/상태/비고
- 회의록 수정 `/meetings/[id]`
  - 기존 데이터 + 액션아이템 불러오기
  - 저장 시 액션아이템 전체 삭제 후 재삽입
- Google Sheets 가져오기 `/meetings/import`
  - 텍스트 붙여넣기 → 탭/줄바꿈 파싱 → 미리보기 테이블 → 회의록 저장
- 컴포넌트
  - `src/components/meetings/meeting-form.tsx` — 회의록 폼 (클라이언트)

### 테스트
- Playwright: 회의록 목록 → 새 작성 (제목, 날짜, 참석자 3명, 내용, 액션아이템 1건) → 저장 → 목록 반영 확인 (0/1 배지) ✅

---

## P4 — 입금/결제 요청

**상태**: ✅ 완료
**날짜**: 2026-02-26

### 작업 내역
- DB 마이그레이션
  - `supabase/migrations/004_payments.sql` — payments 테이블, payment_status enum, RLS 정책
- 결제 요청 목록 `/payments`
  - 요약 카드 3종: 대기 중 / 대기 총액 / 완료
  - 은행별 그룹핑 카드 뷰 (은행명 기준 Card + Table)
  - 완료 처리 버튼 (상태 즉시 반영)
- 결제 요청 등록 `/payments/new`
  - 이름, 금액(천단위 콤마 자동), 은행(19개 프리셋), 계좌번호, 입금자명, 마감일, 비고
- 결제 요청 수정 `/payments/[id]`
  - 완료 상태에서 super/boss만 수정 가능
- 컴포넌트
  - `src/components/payments/payment-form.tsx` — 결제 폼 (클라이언트)
  - `src/components/payments/payment-status-actions.tsx` — 완료 처리 버튼
  - `src/lib/payment-constants.ts` — BANKS 상수 (19개 은행)

### 테스트
- Playwright: 결제 목록 → 요청 등록 (인쇄소 A, 1,500,000원, KB국민) → 저장 → 목록 반영 확인 → 완료 처리 → 대기 0건/완료 1건 확인 ✅

---

## P5 — 견적서 공동 작업

**상태**: ⬜ 대기

---

## P6 — 클라이언트 반응 예측

**상태**: ⬜ 대기

---

## P7 — 설정 + 감사 로그

**상태**: ⬜ 대기

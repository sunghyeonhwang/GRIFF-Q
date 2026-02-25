# GRIFF-Q 0.1 설치된 스킬 목록

> 에이전트 팀원들이 코드 작성 시 참고하는 기술 가이드라인 스킬

## 프로젝트 스킬 (15개)

### 핵심 스택

| # | 스킬 | 출처 | 설명 |
|---|---|---|---|
| 1 | **nextjs-supabase-auth** | sickn33/antigravity | Next.js + Supabase Auth 연동 패턴. 로그인, 세션, RLS 정책 베스트 프랙티스 |
| 2 | **supabase-nextjs** | alinaqi/claude-bootstrap | Supabase + Next.js 통합 부트스트랩. DB 스키마, API 라우트, RLS 템플릿 |
| 3 | **shadcn-ui** | jezweb/claude-skills | shadcn/ui 컴포넌트 사용 가이드라인. 올바른 컴포넌트 조합 패턴 |
| 4 | **tailwind-theme-builder** | jezweb/claude-skills | Tailwind CSS 테마 구성 및 디자인 토큰 관리 가이드 |
| 5 | **vercel-react-best-practices** | vercel-labs/agent-skills | Vercel 공식 React/Next.js 성능 최적화 + 코딩 패턴 (166K 설치) |

### 배포 & DevOps

| # | 스킬 | 출처 | 설명 |
|---|---|---|---|
| 6 | **vercel-deploy** | vercel-labs/agent-skills | Vercel 배포 설정 가이드. Preview/Staging 자동 배포 |
| 7 | **docker-deployment** | pluginagentmarketplace | Docker Compose 기반 배포 가이드. Vultr 프로덕션 배포용 |

### 테스트 & QA

| # | 스킬 | 출처 | 설명 |
|---|---|---|---|
| 8 | **playwright-e2e-testing** | bobmatnyc/claude-mpm-skills | Playwright E2E 테스트 작성 가이드. 전체 플로우 테스트에 활용 |

### AI/API 연동

| # | 스킬 | 출처 | 설명 |
|---|---|---|---|
| 9 | **gemini-api-dev** | google-gemini/gemini-skills | Google 공식 Gemini API 개발 스킬. 아바타 채팅 시스템에 필수 |

### 코드 품질

| # | 스킬 | 출처 | 설명 |
|---|---|---|---|
| 10 | **coding-standards** | sickn33/antigravity | TypeScript 코딩 표준 + 프로젝트 구조 가이드. 코드 일관성 유지 |

### 범용 유틸리티 (기존 설치)

| # | 스킬 | 설명 |
|---|---|---|
| 11 | **brief** | 기획 브리프 생성 (Q&A → 구조화 문서) |
| 12 | **fal-image-gen** | fal.ai 이미지 생성 |
| 13 | **find-skills** | 스킬 검색 및 설치 |
| 14 | **git_commit_writer_ko** | 한국어 커밋 메시지 작성 |
| 15 | **skill-creator** | 커스텀 스킬 생성 가이드 |

---

## Phase별 스킬 매핑

| Phase | 사용 스킬 |
|---|---|
| **P0** 로그인/Auth/레이아웃 | nextjs-supabase-auth, supabase-nextjs, vercel-react-best-practices, shadcn-ui, tailwind-theme-builder |
| **P1** 회고 시스템 | shadcn-ui, coding-standards, vercel-react-best-practices |
| **P2** 대시보드 | shadcn-ui, vercel-react-best-practices |
| **P3** 회의록 관리 | shadcn-ui, coding-standards |
| **P4** 입금/결제 요청 | shadcn-ui, coding-standards |
| **P5** 견적서 실시간 편집 | supabase-nextjs (Realtime), shadcn-ui, coding-standards |
| **P6** 아바타 예측 채팅 | gemini-api-dev, shadcn-ui |
| **P7** 설정 + 백업 | coding-standards, docker-deployment |
| **QA** 테스트 | playwright-e2e-testing |
| **배포** Preview/Staging | vercel-deploy |
| **배포** Production | docker-deployment |

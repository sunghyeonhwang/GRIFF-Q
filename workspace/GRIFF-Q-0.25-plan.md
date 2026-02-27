# GRIFF-Q v0.25 인터페이스 개선 계획

> v0.2 완료 기준 위에서 UI/UX 품질을 실무 운영 수준으로 끌어올리기
> **최종 업데이트: 2026-02-27 (2차 — 스킬/모델 계획 추가)**

---

## 0) 배경

v0.1~v0.2에서 39개 페이지의 기능을 구현했으나, UI/UX는 "기능 구현 우선" 단계에 머물러 있음.
v0.25는 새로운 기능 추가 없이 **기존 인터페이스의 완성도**에 집중한다.

### 현재 상태 분석

| 영역 | 현재 상태 | 문제점 |
|---|---|---|
| 대시보드 | 카드 4종 + 테이블 4종 나열 | 시각화 없음, 정보 밀도 낮음 |
| 테이블 UX | 기본 Table, 클라이언트 필터만 | 페이지네이션/정렬 없음, 빈 상태 미처리 |
| 폼 UX | 기본 validation | 인라인 에러 없음, 저장 피드백 없음 |
| 네비게이션 | 사이드바 + 페이지 제목만 | Breadcrumb 없음, 페이지 헤더 불통일 |
| 로딩/에러 | 거의 없음 | Skeleton 없음, 에러 바운더리 없음 |
| 시각 디자인 | shadcn 기본 테마 | 브랜드 컬러 약함, 단조로움 |
| 마이크로 인터랙션 | 없음 | 전환/애니메이션/피드백 부재 |

---

## 1) v0.25 목표

> 새 기능 0건, 인터페이스 품질 100% 집중

- 공통 UI 인프라 구축 (Breadcrumb, PageHeader, Toast, Skeleton, Empty State)
- 대시보드 차트/위젯 리디자인
- 테이블/목록 UX 강화 (페이지네이션, 정렬, 행 호버)
- 폼 피드백 개선 (인라인 검증, 저장 상태, 이탈 경고)
- 시각 디자인 통일 (색상, 타이포, 다크모드)
- 마이크로 인터랙션 추가 (버튼 로딩, 리스트 애니메이션)

---

## 2) 기술 스택 추가

| 영역 | 추가 패키지 | 용도 |
|---|---|---|
| 차트 | `recharts` | 대시보드 차트 위젯 |
| 토스트 | `sonner` | CRUD 성공/실패 알림 |
| 애니메이션 | (Tailwind animate 활용) | 페이지/리스트 전환 |

---

## 3) Phase 구성

### Phase A: 공통 인프라 (모든 페이지에 영향)

| # | 작업 | 설명 | 난이도 | 영향 범위 |
|---|---|---|---|---|
| A1 | **Breadcrumb 시스템** | 모든 페이지 상단에 `대시보드 > 회의록 > 상세` 경로 표시. pathname 기반 자동 생성 | 낮음 | 39페이지 |
| A2 | **PageHeader 공통 컴포넌트** | 제목 + 설명 + 액션 버튼 패턴 통일. 현재 각 페이지마다 다른 구조 → 하나로 | 낮음 | 39페이지 |
| A3 | **Toast 알림 시스템** | `sonner` 도입. CRUD 성공/실패, 복사, 내보내기 등 전체 피드백 통일 | 낮음 | 전체 |
| A4 | **Skeleton 로딩** | 주요 목록/상세 페이지에 `loading.tsx` + Skeleton UI 적용 | 중간 | 15페이지 |
| A5 | **빈 상태(Empty State)** | 데이터 없을 때 아이콘 + 안내 메시지 + CTA 버튼. 공통 컴포넌트 | 낮음 | 10페이지 |
| A6 | **에러 바운더리** | `error.tsx` + `not-found.tsx` 커스텀 페이지. 친절한 에러 안내 | 낮음 | 전체 |

### Phase B: 대시보드 리디자인

| # | 작업 | 설명 | 난이도 |
|---|---|---|---|
| B1 | **인사말 + 날짜** | "안녕하세요, 성현님" + 오늘 날짜 + 요일 표시 | 낮음 |
| B2 | **퀵 액션 버튼** | "새 회의록", "새 견적서", "입금 등록" 빠른 생성 버튼 그룹 | 낮음 |
| B3 | **차트 위젯** | Recharts 도입 — 월별 입금 추이(라인), 견적 상태(도넛), 회고 제출률(바) | 중간 |
| B4 | **Bento 그리드 레이아웃** | 요약 카드 + 차트 + 테이블을 Bento 스타일 그리드로 재배치 | 중간 |
| B5 | **최근 활동 타임라인** | audit_logs 기반 최근 10건 활동 타임라인 (대시보드 전용) | 중간 |

### Phase C: 테이블/목록 UX 강화

| # | 작업 | 설명 | 난이도 |
|---|---|---|---|
| C1 | **서버사이드 페이지네이션** | 견적서/회의록/결제/감사로그 목록에 페이지네이션 (20건 단위) | 중간 |
| C2 | **컬럼 정렬** | 테이블 헤더 클릭 → 오름차순/내림차순 토글. URL searchParams 기반 | 중간 |
| C3 | **행 호버/선택 효과** | 테이블 행 호버 배경색 + 클릭 가능 행 커서 포인터 | 낮음 |
| C4 | **카드 뷰 토글** | 테이블 ↔ 카드 뷰 전환 버튼 (특히 모바일 최적화) | 중간 |

### Phase D: 폼 UX 개선

| # | 작업 | 설명 | 난이도 |
|---|---|---|---|
| D1 | **인라인 유효성 검사** | Zod 스키마 기반 실시간 필드별 에러 메시지 표시 | 중간 |
| D2 | **Unsaved Changes 경고** | 폼 수정 후 페이지 이탈 시 "저장하지 않은 변경사항" 확인 | 중간 |
| D3 | **자동 저장 상태 표시** | 동시견적 에디터 등에서 "저장 중..." / "저장됨" 인디케이터 | 낮음 |
| D4 | **키보드 단축키** | Cmd+S 저장, Cmd+Enter 제출, Escape 취소 | 낮음 |

### Phase E: 시각 디자인 & 브랜딩

| # | 작업 | 설명 | 난이도 |
|---|---|---|---|
| E1 | **색상 시스템 정비** | 브랜드 프라이머리 컬러 정의, 상태색(성공/경고/에러/정보) 통일 | 중간 |
| E2 | **타이포그래피 계층** | 페이지 제목(h1)/섹션 제목(h2)/본문/캡션 크기·무게 통일 | 낮음 |
| E3 | **아이콘 사용 일관성** | 각 섹션 대표 아이콘 + 액션 아이콘(생성/수정/삭제/내보내기) 통일 | 낮음 |
| E4 | **다크모드 세밀 조정** | 차트 색상, 배지 대비, 카드 테두리, 코드 블록 등 다크모드 최적화 | 중간 |

### Phase F: 마이크로 인터랙션

| # | 작업 | 설명 | 난이도 |
|---|---|---|---|
| F1 | **버튼 로딩 상태** | 서버 액션 실행 중 스피너 + 비활성화. `useTransition` 활용 | 낮음 |
| F2 | **리스트 항목 애니메이션** | 테이블 행/카드 추가·삭제 시 fade-in/slide-out | 중간 |
| F3 | **호버 프리뷰** | 견적서/회의록 목록에서 행 호버 시 간단한 미리보기 팝오버 | 높음 |
| F4 | **숫자 카운트업** | 대시보드 요약 카드 숫자가 0에서 올라가는 애니메이션 | 낮음 |

---

## 4) 우선순위 매트릭스

### 1순위 — 높은 효과, 낮은 난이도 (즉시 착수)

| 작업 | Phase | 예상 소요 |
|---|---|---|
| A1 Breadcrumb | A | 1시간 |
| A2 PageHeader | A | 2시간 |
| A3 Toast 시스템 | A | 1시간 |
| A5 빈 상태 | A | 1시간 |
| A6 에러 페이지 | A | 1시간 |
| B1 인사말 | B | 30분 |
| B2 퀵 액션 | B | 30분 |
| C3 행 호버 | C | 30분 |
| F1 버튼 로딩 | F | 1시간 |
| F4 숫자 카운트업 | F | 30분 |

**소계: ~9시간**

### 2순위 — 높은 효과, 중간 난이도

| 작업 | Phase | 예상 소요 |
|---|---|---|
| A4 Skeleton | A | 3시간 |
| B3 차트 위젯 | B | 4시간 |
| B4 Bento 그리드 | B | 2시간 |
| B5 활동 타임라인 | B | 2시간 |
| D1 인라인 검증 | D | 3시간 |
| D2 Unsaved 경고 | D | 2시간 |
| E1 색상 시스템 | E | 2시간 |

**소계: ~18시간**

### 3순위 — 보강

| 작업 | Phase | 예상 소요 |
|---|---|---|
| C1 페이지네이션 | C | 4시간 |
| C2 컬럼 정렬 | C | 3시간 |
| C4 카드 뷰 토글 | C | 3시간 |
| D3 자동 저장 표시 | D | 1시간 |
| D4 키보드 단축키 | D | 1시간 |
| E2 타이포그래피 | E | 1시간 |
| E3 아이콘 통일 | E | 1시간 |
| E4 다크모드 | E | 2시간 |
| F2 리스트 애니메이션 | F | 2시간 |
| F3 호버 프리뷰 | F | 3시간 |

**소계: ~21시간**

---

## 5) 개발 일정

```
[1순위] Phase A(공통) + B(대시보드 일부) + C3 + F1/F4
  │     → 공통 컴포넌트 + 즉시 효과
  │
  ├→ [2순위] B(차트/그리드) + D(폼) + E1(색상)
  │          → 대시보드 완성 + 폼 품질
  │
  └→ [3순위] C(테이블 고도화) + E(디자인) + F(애니메이션)
             → 최종 마무리
```

### Git 운영

- 브랜치: `feature/v0.25-ui-polish`
- 커밋 컨벤션: `ui:` 접두사 (예: `ui: breadcrumb 시스템 추가`)
- 1순위 완료 → QA → 머지 → 2순위 시작 (순차)

---

## 6) 주요 컴포넌트 설계

### A1: Breadcrumb

```
src/components/layout/breadcrumb-nav.tsx
```
- pathname 파싱 → 자동 경로 생성
- MENU_ITEMS (constants.ts) 기반 한글 라벨 매핑
- 동적 세그먼트 ([id]) → DB에서 이름 조회 또는 "상세" 표시
- app-header.tsx에 통합

### A2: PageHeader

```
src/components/layout/page-header.tsx
```
- Props: title, description?, children? (액션 버튼 슬롯)
- 모바일: 세로 스택, 데스크톱: 가로 배치
- 기존 각 페이지의 헤더 영역을 이 컴포넌트로 교체

### A3: Toast

```
sonner 설치 → src/app/layout.tsx에 <Toaster /> 추가
```
- 성공: 초록 체크, 실패: 빨강 X, 정보: 파랑 i
- 모든 server action 결과에 toast 연동

### A5: EmptyState

```
src/components/ui/empty-state.tsx
```
- Props: icon, title, description, action? (CTA 버튼)
- 테이블 빈 상태, 검색 결과 없음 등에 사용

### B3: 차트 위젯

```
src/components/dashboard/
├── payment-trend-chart.tsx    # 월별 입금 추이 (AreaChart)
├── estimate-status-chart.tsx  # 견적 상태 분포 (PieChart)
└── retro-submit-chart.tsx     # 회고 제출률 (BarChart)
```

---

## 7) 영향받는 기존 파일

| 파일 | 변경 내용 |
|---|---|
| `src/components/layout/app-header.tsx` | Breadcrumb 추가 |
| `src/app/layout.tsx` | `<Toaster />` 추가 |
| `src/app/(dashboard)/dashboard/page.tsx` | 인사말 + 퀵 액션 + 차트 + Bento 레이아웃 |
| `src/app/(dashboard)/*/page.tsx` (목록들) | PageHeader 적용, 빈 상태, 행 호버 |
| `src/components/*/form.tsx` (폼들) | Toast 피드백, 인라인 검증 |
| `src/app/(dashboard)/*/loading.tsx` (신규) | Skeleton UI |
| `src/app/(dashboard)/*/error.tsx` (신규) | 에러 바운더리 |

---

## 8) 스킬 사용 계획

### 설치된 스킬 목록 (v0.25 관련)

| 스킬 | 핵심 역할 | 적용 Phase |
|---|---|---|
| **ui-ux-pro-max** | UI/UX 디자인 철학 + 접근성(WCAG) + 시각 계층 체크리스트 | 전체 |
| **shadcn-ui-expert** | shadcn/ui 컴포넌트 선택·조합·커스터마이징 가이드 | A, C, D |
| **tailwind-css** | Tailwind 유틸리티 패턴, 반응형, 다크모드, 애니메이션 | 전체 |
| **interactive-dashboard-builder** | 차트(Chart.js/Recharts) 패턴, KPI 카드, 필터, 테이블 정렬 | B |
| **nextjs-typescript-tailwindcss-supabase** | Next.js SSR/RSC 우선, loading/error 상태, 코드 품질 기준 | 전체 |

### 기존 설치 스킬 (보조 활용)

| 스킬 | 보조 역할 | 적용 Phase |
|---|---|---|
| **shadcn-ui** (built-in) | 컴포넌트 설치 순서, 시맨틱 토큰, 데이터 테이블 레시피 | A, C |
| **tailwind-theme-builder** (built-in) | Tailwind v4 테마 설정, CSS 변수, 다크모드 설정 | E |
| **vercel-react-best-practices** (built-in) | React/Next.js 성능 최적화, 번들 분석 | 전체 |
| **frontend-design** (built-in) | 프로덕션 그레이드 프론트엔드, AI 생성감 탈피 | B, E |
| **coding-standards** (built-in) | TypeScript/React 코딩 표준, 베스트 프랙티스 | 전체 |

### Phase별 스킬 활용 매핑

#### Phase A: 공통 인프라
```
A1 Breadcrumb      → shadcn-ui-expert (breadcrumb 컴포넌트 가이드)
                   → nextjs-typescript-tailwindcss-supabase (RSC 패턴)
A2 PageHeader      → ui-ux-pro-max (시각 계층 체크리스트: "주역을 1개 정해라")
                   → tailwind-css (반응형 flex-col/flex-row 패턴)
A3 Toast           → shadcn-ui-expert (sonner/toast 통합 가이드)
A4 Skeleton        → shadcn-ui-expert (skeleton 컴포넌트)
                   → nextjs-typescript-tailwindcss-supabase (loading.tsx 패턴)
A5 Empty State     → ui-ux-pro-max (빈 상태도 디자인의 일부)
                   → tailwind-css (아이콘 + 텍스트 중앙 정렬 패턴)
A6 Error Page      → nextjs-typescript-tailwindcss-supabase (error.tsx/not-found.tsx)
```

#### Phase B: 대시보드 리디자인
```
B1 인사말           → tailwind-css (타이포그래피 계층)
B2 퀵 액션         → shadcn-ui-expert (Button 그룹 패턴)
B3 차트 위젯       → interactive-dashboard-builder (차트 타입별 패턴, KPI 카드)
                   → ui-ux-pro-max (차트 접근성, 다크모드 색상 대비)
B4 Bento 그리드    → tailwind-css (grid auto-fit/minmax 패턴)
                   → frontend-design (Bento 레이아웃 디자인)
B5 활동 타임라인    → shadcn-ui-expert (ScrollArea + Card 조합)
                   → nextjs-typescript-tailwindcss-supabase (서버 컴포넌트 데이터 fetching)
```

#### Phase C: 테이블/목록 UX
```
C1 페이지네이션     → shadcn-ui-expert (data-table + pagination 레시피)
                   → interactive-dashboard-builder (서버사이드 페이지네이션 패턴)
C2 컬럼 정렬       → interactive-dashboard-builder (sortable table 패턴)
                   → nextjs-typescript-tailwindcss-supabase (URL searchParams 기반)
C3 행 호버         → tailwind-css (hover: 상태 변형, cursor-pointer)
C4 카드 뷰 토글    → tailwind-css (반응형 그리드 ↔ 리스트 전환)
                   → shadcn-ui-expert (Card 컴포넌트 조합)
```

#### Phase D: 폼 UX 개선
```
D1 인라인 검증     → shadcn-ui-expert (Form + Zod + react-hook-form 패턴)
                   → coding-standards (TypeScript Zod 스키마 베스트 프랙티스)
D2 Unsaved 경고    → nextjs-typescript-tailwindcss-supabase (클라이언트 상태 관리)
D3 자동 저장 표시  → tailwind-css (transition-opacity 애니메이션)
D4 키보드 단축키    → nextjs-typescript-tailwindcss-supabase (이벤트 핸들러 패턴)
```

#### Phase E: 시각 디자인 & 브랜딩
```
E1 색상 시스템     → tailwind-theme-builder (CSS 변수 + @theme inline)
                   → ui-ux-pro-max (WCAG 코트라스트 4.5:1, 다크모드 토큰)
                   → tailwind-css (CSS 변수 기반 색상 시스템)
E2 타이포그래피    → ui-ux-pro-max (타이포 계층: hero/section/headline/subhead)
E3 아이콘 통일     → ui-ux-pro-max (Lucide Icons 일관성, 이모지 금지)
E4 다크모드        → tailwind-css (dark: 변형, 시스템 감지)
                   → ui-ux-pro-max (Glass 카드 내 텍스트 대비 규칙)
                   → tailwind-theme-builder (다크모드 CSS 변수 설정)
```

#### Phase F: 마이크로 인터랙션
```
F1 버튼 로딩       → shadcn-ui-expert (Button disabled + spinner 패턴)
                   → tailwind-css (animate-spin)
F2 리스트 애니메이션 → tailwind-css (keyframes, animate-fade-in 커스텀)
F3 호버 프리뷰     → shadcn-ui-expert (Popover + HoverCard 컴포넌트)
F4 숫자 카운트업    → tailwind-css (transition + JS requestAnimationFrame)
```

### 스킬 활용 원칙

1. **ui-ux-pro-max 5대 철칙 준수**
   - "만들기 전에 의심하라" — 모든 요소에 "정말 필요한가?" 질문
   - "주역을 1개 정하라" — 각 섹션에서 가장 보여줄 것 1개만 결정
   - "70점을 나열하지 마라" — 1개를 120점, 나머지를 60점으로
   - "'할 수 있다'보다 '그만두자'" — 추가보다 삭제를 제안
   - "비판한 후 만들어라" — 현재 문제점 3개 이상 파악 후 개선

2. **접근성 최우선 (ui-ux-pro-max)**
   - WCAG 2.1 코트라스트 비율: 일반 텍스트 4.5:1, 큰 텍스트 3:1
   - 배지/태그의 동계색 조합 피하기
   - 비활성 상태에서도 readable한 opacity (70% 이상)
   - Lighthouse Accessibility 100% 목표

3. **프로젝트 토큰 우선 사용 (ui-ux-pro-max + tailwind-theme-builder)**
   - `text-slate-400` 대신 `text-muted-foreground` 사용
   - `rounded-lg` 대신 프로젝트 CSS 변수 기반 radius 사용
   - globals.css 토큰 먼저 확인 후 코딩 시작

4. **서버 컴포넌트 우선 (nextjs-typescript-tailwindcss-supabase)**
   - `'use client'` 최소화, 격리된 클라이언트 컴포넌트만
   - loading.tsx + error.tsx 필수 제공
   - 시맨틱 HTML 우선

---

## 9) 모델 사용 계획

### 모델 배정 기준

| 모델 | 역할 | 사용 시점 |
|---|---|---|
| **Opus** | 아키텍처 설계, 디자인 시스템, 복잡한 상태 관리 | Phase 시작 설계, 스킬 통합 판단, QA 최종 승인 |
| **Sonnet** | UI 컴포넌트 구현, 페이지 수정, 스타일링 | 대부분의 구현 작업 |
| **Haiku** | 단순 반복, 오타 수정, 클래스명 교체 | 39페이지 PageHeader 일괄 적용 등 |

### Phase별 모델 배정

| Phase | 작업 | 모델 | 이유 |
|---|---|---|---|
| **A1** Breadcrumb 시스템 설계 | Opus | pathname 파싱 로직 + constants.ts 매핑 설계 |
| **A1** Breadcrumb 컴포넌트 구현 | Sonnet | React 컴포넌트 구현 |
| **A1** 39페이지 Breadcrumb 적용 | Haiku | 반복 패턴 일괄 적용 |
| **A2** PageHeader 설계 | Opus | Props 인터페이스 + 반응형 레이아웃 설계 |
| **A2** PageHeader 구현 | Sonnet | 컴포넌트 구현 |
| **A2** 39페이지 PageHeader 교체 | Haiku | 기존 헤더 → PageHeader 일괄 교체 |
| **A3** Toast 시스템 통합 | Sonnet | sonner 설치 + layout 수정 + action 연동 |
| **A4** Skeleton 로딩 | Sonnet | loading.tsx 15개 생성 |
| **A5** EmptyState 컴포넌트 | Sonnet | 공통 컴포넌트 + 10페이지 적용 |
| **A6** 에러 바운더리 | Sonnet | error.tsx + not-found.tsx 생성 |
| **B1~B2** 인사말/퀵 액션 | Sonnet | 간단한 UI 추가 |
| **B3** 차트 위젯 설계 | Opus | Recharts 데이터 구조 + 다크모드 색상 설계 |
| **B3** 차트 컴포넌트 3종 구현 | Sonnet | AreaChart/PieChart/BarChart 구현 |
| **B4** Bento 그리드 레이아웃 | Opus | 대시보드 전체 레이아웃 재설계 |
| **B5** 활동 타임라인 | Sonnet | audit_logs 쿼리 + UI 구현 |
| **C1** 페이지네이션 설계 | Opus | 서버사이드 페이지네이션 아키텍처 |
| **C1** 페이지네이션 구현 | Sonnet | 4개 목록 페이지에 적용 |
| **C2** 컬럼 정렬 | Sonnet | URL searchParams + 테이블 헤더 |
| **C3** 행 호버 | Haiku | CSS 클래스 일괄 추가 |
| **C4** 카드 뷰 토글 | Sonnet | 뷰 전환 컴포넌트 + 모바일 |
| **D1** Zod 스키마 + 인라인 검증 | Opus | 기존 폼 6개의 검증 전략 설계 |
| **D1** 폼별 검증 구현 | Sonnet | 각 폼에 Zod + 에러 메시지 적용 |
| **D2** Unsaved Changes | Sonnet | beforeunload + 상태 비교 |
| **D3~D4** 자동 저장/단축키 | Sonnet | 이벤트 핸들러 |
| **E1** 색상 시스템 설계 | Opus | 브랜드 컬러 팔레트 + CSS 변수 + 접근성 검증 |
| **E1** globals.css 수정 | Sonnet | CSS 변수 적용 |
| **E2~E3** 타이포/아이콘 | Haiku | 클래스 통일 일괄 작업 |
| **E4** 다크모드 세밀 조정 | Sonnet | 차트/배지/카드 다크모드 |
| **F1** 버튼 로딩 상태 | Sonnet | useTransition + spinner |
| **F1** 전체 버튼 일괄 적용 | Haiku | 반복 패턴 적용 |
| **F2** 리스트 애니메이션 | Sonnet | keyframes + Tailwind 커스텀 |
| **F3** 호버 프리뷰 | Opus | Popover 데이터 fetching 전략 설계 |
| **F4** 숫자 카운트업 | Sonnet | requestAnimationFrame 구현 |

### 모델별 작업량 요약

| 모델 | 작업 수 | 주요 역할 | 비율 |
|---|---|---|---|
| **Opus** | 7개 | 아키텍처 설계, 디자인 시스템, 복잡한 상태 관리 | ~20% |
| **Sonnet** | 22개 | UI 컴포넌트 구현, 페이지 수정, 스타일링 | ~65% |
| **Haiku** | 5개 | 반복 패턴 일괄 적용, 클래스명 교체 | ~15% |

### 에스컬레이션 기준

| 상황 | 처리 |
|---|---|
| 단순 UI 구현, 컴포넌트 교체 | Sonnet/Haiku로 처리 |
| 디자인 시스템 변경, CSS 변수 구조 | Opus 설계 → Sonnet 구현 |
| 접근성 이슈 (WCAG 위반) | Opus 분석 + ui-ux-pro-max 체크리스트 |
| 39페이지 일괄 수정 | Haiku로 반복 처리 |
| Recharts + 다크모드 색상 충돌 | Opus 설계 (interactive-dashboard-builder 참조) |
| 성능 이슈 (번들 크기, 렌더링) | Opus 분석 (vercel-react-best-practices 참조) |

### 작업 흐름

```
[Opus] 설계/아키텍처 결정
  │
  │  · Phase별 시작 시 스킬 체크리스트 확인
  │  · 컴포넌트 인터페이스(Props) 설계
  │  · 디자인 토큰/색상 결정
  │
  ├→ [Sonnet] 구현
  │    │
  │    │  · 스킬 가이드 참조하며 컴포넌트 작성
  │    │  · 페이지별 적용
  │    │  · 다크모드 확인
  │    │
  │    └→ [Haiku] 반복 적용
  │         │
  │         │  · 39페이지 일괄 PageHeader 교체
  │         │  · CSS 클래스 일괄 변경
  │         │  · 오타/스타일 통일
  │         │
  └→ [Opus] QA + 최종 승인
       │
       │  · ui-ux-pro-max Pre-Delivery Checklist
       │  · WCAG 접근성 검증
       │  · 다크모드 전체 확인
       │  · Lighthouse 점수 확인
       │
       └→ 머지
```

---

## 10) 에이전트 팀 운영

### 팀 구조

```
┌─────────────────────────────────────────────┐
│        팀장 (Opus) — Lead                    │
│  · Phase별 설계 결정 + 스킬 체크리스트 운영   │
│  · 디자인 시스템/색상/접근성 최종 판단         │
│  · QA: ui-ux-pro-max Pre-Delivery Checklist  │
│  · 머지 승인                                 │
└──────────┬──────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────┐
│        Workers (Sonnet × 2~3)                │
│                                              │
│  [Worker A — 공통 인프라]                     │
│    담당: A1~A6 (Breadcrumb, PageHeader,       │
│           Toast, Skeleton, EmptyState, Error) │
│    스킬: shadcn-ui-expert + nextjs-ts-tw-sb  │
│                                              │
│  [Worker B — 대시보드 + 차트]                 │
│    담당: B1~B5 (인사말, 퀵액션, 차트, Bento)  │
│    스킬: interactive-dashboard-builder       │
│          + frontend-design                   │
│                                              │
│  [Worker C — 테이블/폼/마이크로]              │
│    담당: C1~C4, D1~D4, F1~F4                 │
│    스킬: shadcn-ui-expert + tailwind-css     │
│                                              │
│  서로 직접 소통하며 개발                       │
│  충돌/블로커 → 팀장에 에스컬레이션             │
└──────────────────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────┐
│        Haiku — 반복 작업 전담                 │
│                                              │
│  · 39페이지 PageHeader 일괄 교체              │
│  · 39페이지 Breadcrumb 일괄 적용              │
│  · CSS 클래스 일괄 통일 (타이포/아이콘)        │
│  · 버튼 로딩 상태 일괄 적용                   │
│  · Worker 지시에 따라 반복 패턴 실행           │
└──────────────────────────────────────────────┘
```

### Worker별 스킬 배정

| Worker | 모델 | 담당 Phase | 주 사용 스킬 | 보조 스킬 |
|---|---|---|---|---|
| **팀장** | Opus | 전체 설계/QA | ui-ux-pro-max | vercel-react-best-practices |
| **Worker A** | Sonnet | A (공통 인프라) | shadcn-ui-expert, nextjs-ts-tw-sb | shadcn-ui (built-in) |
| **Worker B** | Sonnet | B (대시보드) | interactive-dashboard-builder | frontend-design, tailwind-css |
| **Worker C** | Sonnet | C, D, F (테이블/폼/인터랙션) | shadcn-ui-expert, tailwind-css | coding-standards |
| **Haiku** | Haiku | 일괄 적용 | — (패턴 전달받아 실행) | — |

### Phase별 워커 병렬 흐름

```
── 1순위 ──────────────────────────────────────────────

[Opus] E1 색상 시스템 설계 (globals.css 토큰 정의)
  │     → 완료 후 Worker A, B, C에 토큰 전달
  │
  ├─ [Worker A] A1 Breadcrumb + A2 PageHeader + A3 Toast
  │                A5 EmptyState + A6 Error Page
  │                → [Haiku] 39페이지 일괄 적용
  │
  ├─ [Worker B] B1 인사말 + B2 퀵 액션
  │
  └─ [Worker C] C3 행 호버 + F1 버튼 로딩 + F4 카운트업
                  → [Haiku] 버튼 로딩 일괄 적용

  → [Opus] 1순위 QA (체크리스트)

── 2순위 ──────────────────────────────────────────────

  ├─ [Worker A] A4 Skeleton (loading.tsx 15개)
  │
  ├─ [Worker B] B3 차트 위젯 3종 + B4 Bento 그리드 + B5 타임라인
  │             (Opus 설계 먼저 받음)
  │
  └─ [Worker C] D1 인라인 검증 (Opus 설계 먼저 받음) + D2 Unsaved
                E1 색상 적용 (Opus 토큰 기반)

  → [Opus] 2순위 QA

── 3순위 ──────────────────────────────────────────────

  ├─ [Worker A] 유휴 → Worker C 지원
  │
  ├─ [Worker B] 유휴 → E4 다크모드 차트 최적화
  │
  └─ [Worker C] C1 페이지네이션 + C2 컬럼 정렬 + C4 카드 뷰
                D3 자동 저장 + D4 단축키
                F2 리스트 애니메이션 + F3 호버 프리뷰
                → [Haiku] E2 타이포 + E3 아이콘 일괄 통일

  → [Opus] 최종 QA + Pre-Delivery Checklist + 머지
```

### 에스컬레이션 기준

| 상황 | 처리 |
|---|---|
| 단순 UI 구현, 컴포넌트 조합 | Worker끼리 해결 |
| Worker 간 컴포넌트 의존성 (예: EmptyState를 C에서 사용) | Worker끼리 메시지 |
| 디자인 토큰 변경, CSS 변수 구조 수정 | 즉시 팀장 에스컬레이션 |
| WCAG 접근성 위반 발견 | 즉시 팀장 에스컬레이션 |
| 다크모드에서 차트 색상 깨짐 | Worker B → 팀장 (1회 시도 후) |
| 39페이지 일괄 수정 시 빌드 에러 | Haiku → Worker A 보고 |
| Recharts 번들 크기 이슈 | 즉시 팀장 (vercel-react-best-practices 참조) |
| QA 최종 승인 | 팀장만 판단 |

---

## 11) 완료 기준

- [ ] 모든 페이지에 Breadcrumb + PageHeader 적용
- [ ] 모든 CRUD 작업에 Toast 피드백 표시
- [ ] 주요 목록 5개 이상에 Skeleton 로딩 적용
- [ ] 빈 상태 컴포넌트 적용 (데이터 없는 테이블 전체)
- [ ] 대시보드에 차트 3종 이상 표시
- [ ] 에러 페이지(error.tsx, not-found.tsx) 커스텀 적용
- [ ] 모든 서버 액션 버튼에 로딩 상태 표시
- [ ] 다크모드에서 차트/배지 색상 정상 표시

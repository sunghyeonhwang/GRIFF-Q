# GRIFF-Q v0.25 인터페이스 개선 계획

> v0.2 완료 기준 위에서 UI/UX 품질을 실무 운영 수준으로 끌어올리기
> **최종 업데이트: 2026-02-28 (5차 — Phase A + E1 + B + C 구현 완료)**

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

## 3) 디자인 스타일 — 모던 글래스 + #FEEB00

### 디자인 방향

> **모던 글래스모피즘** — 반투명 카드, backdrop-blur, 브랜드 옐로(#FEEB00) 포인트
> 레퍼런스 느낌: Vercel Dashboard + Arc Browser

### 브랜드 컬러 팔레트

| 토큰 | 라이트 모드 | 다크 모드 | 용도 |
|---|---|---|---|
| **`--brand`** | `#FEEB00` | `#FEEB00` | 포인트 컬러 (버튼, 링크, 액센트) |
| **`--brand-foreground`** | `#1a1a1a` | `#1a1a1a` | 브랜드 위의 텍스트 (항상 다크) |
| **`--brand-hover`** | `#E5D400` | `#FFE033` | 버튼 호버 |
| **`--brand-muted`** | `#FEEB00/15%` | `#FEEB00/20%` | 배지 배경, 하이라이트 |
| **`--brand-ring`** | `#FEEB00/50%` | `#FEEB00/40%` | 포커스 링 |

### 글래스 토큰

| 토큰 | 라이트 모드 | 다크 모드 | 용도 |
|---|---|---|---|
| **`--glass-bg`** | `rgba(255,255,255, 0.7)` | `rgba(255,255,255, 0.05)` | 글래스 카드 배경 |
| **`--glass-border`** | `rgba(0,0,0, 0.08)` | `rgba(255,255,255, 0.1)` | 글래스 카드 테두리 |
| **`--glass-blur`** | `16px` | `20px` | backdrop-blur 강도 |
| **`--glass-shadow`** | `0 8px 32px rgba(0,0,0,0.06)` | `0 8px 32px rgba(0,0,0,0.3)` | 글래스 카드 그림자 |

### 컴포넌트별 스타일 변경

#### 버튼 (Primary CTA)

```
현재: bg-primary(검정/회색) text-primary-foreground
변경: bg-brand(#FEEB00) text-brand-foreground(#1a1a1a)
호버: bg-brand-hover + shadow-lg + scale-[1.02] transition
```

```tsx
// Before
<Button>새 견적서 작성</Button>  // 검정 배경 + 흰 텍스트

// After
<Button>새 견적서 작성</Button>  // #FEEB00 배경 + 검정 텍스트, 호버 시 살짝 밝아짐
```

#### 카드 (글래스모피즘)

```
현재: bg-card border border-border rounded-lg shadow-sm
변경: bg-glass-bg backdrop-blur-[var(--glass-blur)]
      border border-glass-border rounded-xl shadow-glass
```

```tsx
// Before
<Card>              // 불투명 흰색/검정 카드

// After (라이트)
<Card>              // 반투명 흰색 + blur, 뒤 배경 살짝 비침
// After (다크)
<Card>              // 반투명 어두운 유리 + blur, 미묘한 빛 반사
```

#### 사이드바

```
현재: 불투명 배경, 단조로운 메뉴
변경: 글래스 배경 + 활성 메뉴에 #FEEB00 왼쪽 보더
      로고 옆 #FEEB00 도트/언더라인 액센트
```

```
활성 메뉴: border-l-2 border-brand bg-brand-muted
호버: bg-glass-bg
```

#### 대시보드 요약 카드

```
현재: bg-card + 아이콘 + 숫자
변경: 글래스 카드 + #FEEB00 아이콘 하이라이트
      숫자: text-3xl font-bold
      변화량: #FEEB00 or destructive 색상
```

#### 배지/태그

```
현재: Badge variant=default/secondary/destructive
변경: 상태별 색상 유지 + 글래스 배경
      성공: bg-green-500/15 text-green-700 dark:text-green-400
      경고: bg-brand-muted text-brand-foreground
      에러: bg-destructive/15 text-destructive
      정보: bg-blue-500/15 text-blue-700 dark:text-blue-400
```

#### 테이블

```
현재: 기본 shadcn Table
변경: 헤더 bg-muted/50 backdrop-blur
      행 호버: bg-brand-muted/30
      활성 행: border-l-2 border-brand
```

#### 입력 필드

```
현재: border border-input rounded-md
변경: bg-glass-bg border border-glass-border rounded-lg
      포커스: ring-2 ring-brand-ring border-brand
```

#### 차트 색상

```
차트 팔레트 (브랜드 옐로 중심):
--chart-1: #FEEB00 (브랜드 옐로)
--chart-2: #3B82F6 (블루)
--chart-3: #10B981 (그린)
--chart-4: #F97316 (오렌지)
--chart-5: #8B5CF6 (퍼플)
```

### 배경 패턴

```
라이트 모드: 미묘한 그라디언트 배경
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 50%, #fefce8 100%);
  → 흰색에서 살짝 블루/옐로 틴트

다크 모드: 깊은 어두운 배경 + 미묘한 그라디언트
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #1a1a0f 100%);
  → 거의 검정에서 살짝 남색/올리브 틴트
```

### 접근성 주의사항 (#FEEB00 특수)

| 상황 | 문제 | 대응 |
|---|---|---|
| #FEEB00 위의 텍스트 | 밝은 노란색 → 흰색 텍스트 불가 | **항상 검정/어두운 텍스트** 사용 |
| 라이트 모드 배경 위 #FEEB00 텍스트 | 흰 배경 + 노랑 텍스트 = 코트라스트 부족 | 텍스트로 사용 금지, **배경/보더로만** 사용 |
| 라이트 모드 #FEEB00 배지 | 배경 너무 밝음 | `bg-brand-muted`(15% opacity) + 어두운 텍스트 |
| 다크 모드 #FEEB00 | 검정 배경에서 잘 보임 | 포인트 효과 극대화 |

**#FEEB00 사용 규칙:**
- 버튼 배경: OK (텍스트는 반드시 `#1a1a1a`)
- 아이콘 색상: OK (다크 모드에서 특히 효과적)
- 보더/언더라인: OK
- 텍스트 색상: 금지 (라이트 모드에서 가독성 부족)
- 배지 배경: 15~20% opacity만 허용

### globals.css 변경 계획

```css
/* 추가할 커스텀 속성 */
:root {
  /* Brand */
  --brand: #FEEB00;
  --brand-foreground: #1a1a1a;
  --brand-hover: #E5D400;
  --brand-muted: rgba(254, 235, 0, 0.15);
  --brand-ring: rgba(254, 235, 0, 0.5);

  /* Glass */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.08);
  --glass-blur: 16px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);

  /* Background gradient */
  --page-gradient: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 50%, #fefce8 100%);

  /* primary 오버라이드 → 브랜드 옐로 */
  --primary: #FEEB00;
  --primary-foreground: #1a1a1a;

  /* 차트 팔레트 */
  --chart-1: #FEEB00;
  --chart-2: #3B82F6;
  --chart-3: #10B981;
  --chart-4: #F97316;
  --chart-5: #8B5CF6;
}

.dark {
  /* Brand (동일) */
  --brand: #FEEB00;
  --brand-foreground: #1a1a1a;
  --brand-hover: #FFE033;
  --brand-muted: rgba(254, 235, 0, 0.20);
  --brand-ring: rgba(254, 235, 0, 0.4);

  /* Glass */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 20px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  /* Background gradient */
  --page-gradient: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #1a1a0f 100%);

  /* primary 오버라이드 */
  --primary: #FEEB00;
  --primary-foreground: #1a1a1a;

  /* 차트 팔레트 (다크용 밝기 조정) */
  --chart-1: #FEEB00;
  --chart-2: #60A5FA;
  --chart-3: #34D399;
  --chart-4: #FB923C;
  --chart-5: #A78BFA;
}
```

### @theme inline 추가

```css
@theme inline {
  /* 기존 토큰에 추가 */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-hover: var(--brand-hover);
  --color-brand-muted: var(--brand-muted);
  --color-brand-ring: var(--brand-ring);
  --color-glass-bg: var(--glass-bg);
  --color-glass-border: var(--glass-border);
}
```

### Before / After 요약

| 요소 | Before (현재) | After (v0.25) |
|---|---|---|
| **Primary 버튼** | 검정 배경 + 흰 텍스트 | **#FEEB00 배경 + 검정 텍스트** + 호버 쉐도우 |
| **카드** | 불투명 흰색/회색 | **반투명 글래스** + backdrop-blur + 미묘한 테두리 |
| **사이드바** | 불투명 배경, 기본 메뉴 | **글래스 배경** + 활성 메뉴 #FEEB00 보더 |
| **페이지 배경** | 단색 흰색/검정 | **미묘한 그라디언트** (블루/옐로 틴트) |
| **입력 필드** | 기본 보더 | **글래스 배경** + 포커스 시 #FEEB00 링 |
| **배지** | 불투명 색상 배경 | **반투명** 상태별 색상 |
| **차트** | 기본 차트 색상 | **#FEEB00 중심 팔레트** |
| **호버 효과** | 배경색만 변경 | **scale + shadow + brand-muted** |
| **전체 분위기** | 기능적, 단조로움 | **투명감 + 깊이감 + 옐로 포인트** |

---

## 4) Phase 구성

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

## 11) Phase별 테스트 & 수정 계획

### 테스트 루틴 (모든 Phase 공통 — 문제 0건까지 반복)

```
[구현 완료]
     │
     ▼
[Step 1] 자동 테스트
     │  · next build — 빌드 에러 0건 확인
     │  · next lint — lint 에러 0건 확인
     │  · grep 금지 패턴 검사 (Tailwind 직접색 등)
     │
     ▼
[Step 2] 브라우저 직접 테스트 (Chrome DevTools MCP)
     │  · next dev 실행
     │  · chrome-devtools로 페이지 열기
     │  · take_screenshot → 스크린샷 캡처 (라이트/다크)
     │  · emulate → 모바일(375px) 뷰포트 확인
     │  · evaluate_script → 콘솔 에러 확인
     │  · 해당 페이지의 CRUD 동작 직접 실행 (click, fill)
     │
     ▼
[Step 3] 이슈 발견?
     │
     ├─ YES → [수정] → Step 1로 돌아감 (반복)
     │         · Worker가 즉시 코드 수정
     │         · 다시 빌드 + 브라우저 확인
     │         · 문제 0건이 될 때까지 반복
     │
     └─ NO → [Step 4] 팀장 QA
              │  · Opus가 스크린샷 리뷰
              │  · ui-ux-pro-max Pre-Delivery Checklist
              │  · WCAG 접근성 + 다크모드 + 모바일
              │
              ├─ PASS → 다음 Phase 진행
              └─ FAIL → Worker에 수정 지시 → Step 1로 돌아감
```

> **핵심 원칙: "문제 0건까지 반복"**
> - 빌드 에러 0건, 콘솔 에러 0건, 레이아웃 깨짐 0건이 될 때까지 수정-테스트 루프
> - 브라우저를 직접 열어서(Chrome DevTools MCP) 스크린샷 캡처 + 클릭 테스트
> - 라이트/다크 모드 × 모바일/데스크톱 = 최소 4가지 조합 확인
> - 한 번의 테스트로 끝내지 않고, 수정할 때마다 다시 테스트

### Phase A: 공통 인프라 — 테스트

| 작업 | 자동 테스트 | 수동 테스트 | 수정 기준 |
|---|---|---|---|
| A1 Breadcrumb | `next build` 성공 | 39페이지 순회 → 경로 정확성, 클릭 이동 확인 | 경로 불일치 0건 |
| A2 PageHeader | `next build` 성공 | 모바일(375px) + 데스크톱(1440px)에서 레이아웃 확인 | 겹침/잘림 0건 |
| A3 Toast | `next build` 성공 | CRUD 작업 5종(생성/수정/삭제/복사/내보내기) 실행 → 토스트 표시 확인 | 피드백 누락 0건 |
| A4 Skeleton | `next build` 성공 | 네트워크 쓰로틀링(Slow 3G) → Skeleton 표시 확인 | 빈 화면 노출 0건 |
| A5 EmptyState | `next build` 성공 | 빈 DB 상태에서 목록 10페이지 → EmptyState + CTA 확인 | "데이터 없음" 방치 0건 |
| A6 Error Page | 404 URL 접근, throw Error 강제 | error.tsx/not-found.tsx 디자인 + 홈 링크 확인 | 기본 Next.js 에러 노출 0건 |

**수정 사이클:**
1. Worker A 구현 → `next build` 통과 확인
2. Worker A 39페이지 수동 순회 (Breadcrumb + PageHeader)
3. 발견 이슈 즉시 수정 (Worker A or Haiku 일괄)
4. 팀장(Opus) 최종 QA: 라이트/다크 모드, 모바일/데스크톱 5페이지 샘플링
5. PASS → 다음 Phase / FAIL → Worker에 수정 지시 + 재테스트

### Phase B: 대시보드 리디자인 — 테스트

| 작업 | 자동 테스트 | 수동 테스트 | 수정 기준 |
|---|---|---|---|
| B1 인사말 | 빌드 성공 | 사용자 이름 표시 + 날짜 정확성 | 이름/날짜 불일치 0건 |
| B2 퀵 액션 | 빌드 성공 | 각 버튼 클릭 → 대상 페이지 이동 확인 | 링크 오류 0건 |
| B3 차트 위젯 | 빌드 성공 | 라이트/다크 모드 차트 가독성, 빈 데이터 시 표시, 모바일 레이아웃 | 차트 깨짐 0건, 다크모드 색상 대비 WCAG 3:1+ |
| B4 Bento 그리드 | 빌드 성공 | 375px / 768px / 1440px 3개 뷰포트에서 그리드 배치 확인 | 겹침/잘림 0건 |
| B5 활동 타임라인 | 빌드 성공 | audit_logs 데이터 반영 확인, 빈 상태 확인 | 데이터 불일치 0건 |

**수정 사이클:**
1. Worker B 구현 → `next build` 통과
2. Worker B 대시보드 스크린샷 캡처 (라이트/다크 × 모바일/데스크톱 = 4장)
3. 팀장(Opus) 스크린샷 리뷰: 시각 계층, 정보 밀도, 색상 대비
4. FAIL 항목 → Worker B 수정 → 재캡처 → 재리뷰
5. Recharts 번들 크기 확인 (`next build` 출력에서 chunk 크기 체크)

### Phase C: 테이블/목록 UX — 테스트

| 작업 | 자동 테스트 | 수동 테스트 | 수정 기준 |
|---|---|---|---|
| C1 페이지네이션 | 빌드 성공 | 20건+ 데이터 → 페이지 전환, URL params 유지, 첫/끝 페이지 경계 | 페이지 이동 오류 0건 |
| C2 컬럼 정렬 | 빌드 성공 | 각 컬럼 클릭 → 정렬 방향 토글, URL 반영, 새로고침 후 유지 | 정렬 불일치 0건 |
| C3 행 호버 | 빌드 성공 | 호버 배경색 + 커서 포인터 확인 (라이트/다크) | 다크모드 호버 안 보임 0건 |
| C4 카드 뷰 토글 | 빌드 성공 | 테이블 ↔ 카드 전환, 모바일에서 카드 기본, 데이터 일치 | 뷰 전환 시 데이터 손실 0건 |

**수정 사이클:**
1. Worker C 구현 → `next build` 통과
2. 견적서/회의록/결제/감사로그 4개 목록에서 페이지네이션 + 정렬 조합 테스트
3. 엣지 케이스: 0건, 1건, 정확히 20건, 21건
4. 팀장 QA: URL searchParams 일관성 + 새로고침 유지
5. FAIL → Worker C 수정 → 재테스트

### Phase D: 폼 UX — 테스트

| 작업 | 자동 테스트 | 수동 테스트 | 수정 기준 |
|---|---|---|---|
| D1 인라인 검증 | 빌드 성공 | 빈 필드 제출, 잘못된 형식 입력 → 에러 메시지 즉시 표시 | 에러 표시 누락 0건 |
| D2 Unsaved 경고 | 빌드 성공 | 폼 수정 후 뒤로가기/링크 클릭 → 경고 다이얼로그 표시 | 데이터 유실 가능 상황 0건 |
| D3 자동 저장 표시 | 빌드 성공 | 동시견적 에디터에서 셀 수정 → "저장 중..."→"저장됨" 전환 | 상태 미표시 0건 |
| D4 키보드 단축키 | 빌드 성공 | Cmd+S(저장), Cmd+Enter(제출), Esc(취소) 동작 확인 | 단축키 미동작 0건, 기본 브라우저 동작 충돌 0건 |

**수정 사이클:**
1. Worker C 구현 → `next build` 통과
2. 폼 6종(회고/회의록/결제/견적서/아바타/포스트모템) 각각 테스트
3. 테스트 시나리오: 정상 입력 → 성공 / 빈 필드 → 에러 / 수정 후 이탈 → 경고
4. 팀장 QA: 에러 메시지 한글화 + UX 자연스러움
5. FAIL → Worker C 수정 → 해당 폼만 재테스트

### Phase E: 시각 디자인 — 테스트

| 작업 | 자동 테스트 | 수동 테스트 | 수정 기준 |
|---|---|---|---|
| E1 색상 시스템 | 빌드 성공, `grep` 금지 패턴 검사 | 라이트/다크 전환 → 모든 카드/배지/버튼 색상 확인 | Tailwind 직접색 사용 0건 (토큰만) |
| E2 타이포그래피 | 빌드 성공 | 39페이지에서 h1/h2/본문/캡션 크기 일관성 | 비표준 크기 사용 0건 |
| E3 아이콘 통일 | 빌드 성공 | 사이드바/헤더/버튼 아이콘 일관성 | 이모지 사용 0건, 미통일 아이콘 0건 |
| E4 다크모드 | 빌드 성공 | 39페이지 다크모드 순회 → 읽기 어려운 텍스트, 안 보이는 테두리 | WCAG 코트라스트 위반 0건 |

**수정 사이클:**
1. Opus가 globals.css 토큰 정의 → Sonnet/Haiku 적용
2. 토큰 위반 자동 검사:
   ```bash
   grep -r "text-slate-\|text-gray-\|bg-slate-\|bg-gray-" src/components/
   ```
3. 위반 발견 → Haiku 일괄 교체
4. 팀장 QA: Lighthouse Accessibility 점수 측정 (목표 95+)
5. 다크모드 39페이지 스크린샷 전수 검사 (Haiku 지원)

### Phase F: 마이크로 인터랙션 — 테스트

| 작업 | 자동 테스트 | 수동 테스트 | 수정 기준 |
|---|---|---|---|
| F1 버튼 로딩 | 빌드 성공 | 서버 액션 버튼 클릭 → 스피너 표시 + 비활성화, 완료 후 복구 | 이중 클릭 가능 0건 |
| F2 리스트 애니메이션 | 빌드 성공 | 항목 추가/삭제 시 애니메이션 재생, 느린 기기에서 버벅임 없음 | 애니메이션 깨짐 0건 |
| F3 호버 프리뷰 | 빌드 성공 | 목록 행 호버 → 프리뷰 팝오버 표시/숨김, 모바일에서 미표시 | 팝오버 잘림 0건 |
| F4 숫자 카운트업 | 빌드 성공 | 대시보드 진입 시 숫자 0→실제값 애니메이션, 새로고침 시 재실행 | 깜빡임 0건 |

**수정 사이클:**
1. Worker C 구현 → `next build` 통과
2. Chrome DevTools Performance 탭으로 애니메이션 프레임 드롭 확인
3. 팀장 QA: 애니메이션이 "AI 생성감" 주는지 (과잉 여부) 판단
4. 과잉 → 제거/축소 지시 / 적절 → PASS

---

### 전체 회귀 테스트 (최종)

v0.25 전체 작업 완료 후, 기존 기능에 영향이 없는지 회귀 테스트를 수행한다.

| 테스트 시나리오 | 검증 항목 | 담당 |
|---|---|---|
| 로그인 → 대시보드 진입 | 인사말 + 차트 + 위젯 정상 | Worker B |
| 회고 작성 → 제출 → 목록 확인 | 폼 검증 + Toast + Skeleton | Worker C |
| 회의록 목록 → 필터 → 상세 → 인쇄 | 페이지네이션 + 정렬 + PageHeader | Worker A |
| 견적서 생성 → 동시편집 → PDF | Realtime 정상 + 버튼 로딩 | Worker C |
| 결제 등록 → 완료 → Excel 내보내기 | Toast + EmptyState (완료 시) | Worker A |
| 아바타 채팅 → 감정 분석 | Unsaved 경고 (채팅 중 이탈) | Worker C |
| 설정 → 감사 로그 → 복원 | 페이지네이션 + 상세 다이얼로그 | Worker A |
| 전체 39페이지 다크모드 순회 | 색상 대비 + 레이아웃 | Haiku |
| 모바일(375px) 전체 순회 | 반응형 레이아웃 + 터치 | Haiku |

**회귀 테스트 PASS 기준:**
- `next build` 에러 0건
- 기존 CRUD 기능 정상 동작
- 다크모드 WCAG 코트라스트 위반 0건
- 모바일 레이아웃 깨짐 0건
- Lighthouse Accessibility 95+ 점

---

## 12) 완료 기준

- [x] 모든 페이지에 Breadcrumb + PageHeader 적용
- [x] 모든 CRUD 작업에 Toast 피드백 표시
- [x] 주요 목록 5개 이상에 Skeleton 로딩 적용
- [x] 빈 상태 컴포넌트 적용 (데이터 없는 테이블 전체)
- [x] 대시보드에 차트 3종 이상 표시
- [x] 에러 페이지(error.tsx, not-found.tsx) 커스텀 적용
- [ ] 모든 서버 액션 버튼에 로딩 상태 표시
- [ ] 다크모드에서 차트/배지 색상 정상 표시

---

## 13) 구현 로그

### Phase A + E1 — 2026-02-28 완료

**커밋:** `95b26f5` (`ui: Phase A 공통 인프라 구현 + E1 브랜드 컬러 시스템`)
**변경:** 45 files, +893 / -187

#### E1 색상 시스템 (선행)

| 항목 | 내용 |
|---|---|
| 브랜드 토큰 | `--brand: #FEEB00`, `--brand-foreground: #1a1a1a`, `--brand-hover`, `--brand-muted`, `--brand-ring` |
| 글래스 토큰 | `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow` (라이트/다크 분리) |
| 페이지 그라디언트 | `--page-gradient` (라이트: 블루/옐로 틴트, 다크: 남색/올리브 틴트) |
| primary 오버라이드 | `--primary: #FEEB00`, `--primary-foreground: #1a1a1a` (라이트/다크 동일) |
| 차트 팔레트 | 5색 (옐로, 블루, 그린, 오렌지, 퍼플) — 다크 모드 밝기 조정 |
| @theme inline | `--color-brand-*`, `--color-glass-*` 등록 완료 |

#### A1 Breadcrumb 시스템

| 항목 | 내용 |
|---|---|
| 파일 | `src/components/layout/breadcrumb-nav.tsx` (신규) |
| 의존 | shadcn `breadcrumb` 컴포넌트 설치 |
| 기능 | pathname 자동 파싱, `MENU_ITEMS` 기반 한글 라벨 매핑, UUID/숫자 ID → "상세" 표시 |
| 통합 | `app-header.tsx`에 `<BreadcrumbNav />` 추가 |
| 적용 범위 | 전체 대시보드 (2개 이상 세그먼트 경로에서 자동 표시) |

#### A2 PageHeader 공통 컴포넌트

| 항목 | 내용 |
|---|---|
| 파일 | `src/components/layout/page-header.tsx` (신규) |
| Props | `title`, `description?`, `children?` (액션 버튼 슬롯) |
| 레이아웃 | 모바일: 세로 스택, 데스크톱: 가로 배치 (`sm:flex-row`) |
| 적용 페이지 (12개) | dashboard, payments, estimates, retrospective/sprint, retrospective/postmortem, retrospective/guide, predict/avatars, projects, meetings/action-items, settings/logs, settings/users |
| 미적용 | meetings (클라이언트 컴포넌트 내부), estimates/collab (클라이언트 컴포넌트 내부), redirect-only 페이지 3개 |

#### A3 Toast 알림 시스템

| 항목 | 내용 |
|---|---|
| 패키지 | `sonner` 설치 |
| Toaster | `src/app/layout.tsx`에 `<Toaster richColors closeButton position="top-right" />` 추가 |
| alert 교체 | **14개 컴포넌트**에서 `alert()` → `toast.error()` / `toast.success()` 전환 |
| 잔여 alert | **0건** (전체 src/ 검증 완료) |

**교체된 컴포넌트 목록:**
- `payments/payment-form.tsx`, `payments/payment-status-actions.tsx`
- `estimates/estimate-form.tsx`, `estimates/template-manager.tsx`, `estimates/sheets-export-button.tsx`
- `meetings/meeting-form.tsx`, `meetings/sheets-export-button.tsx`
- `meetings/import/page.tsx`
- `retrospective/retrospective-form.tsx`
- `projects/project-create-dialog.tsx`, `projects/postmortem-form.tsx`
- `predict/avatar-form.tsx`, `predict/training-data-list.tsx`
- `settings/user-role-actions.tsx`

#### A4 Skeleton 로딩

| 항목 | 내용 |
|---|---|
| 생성 파일 (8개) | `dashboard/loading.tsx`, `payments/loading.tsx`, `estimates/loading.tsx`, `meetings/loading.tsx`, `retrospective/sprint/loading.tsx`, `projects/loading.tsx`, `settings/logs/loading.tsx`, `predict/avatars/loading.tsx` |
| 패턴 | 각 페이지의 실제 레이아웃과 동일한 구조의 Skeleton UI |

#### A5 EmptyState 컴포넌트

| 항목 | 내용 |
|---|---|
| 파일 | `src/components/ui/empty-state.tsx` (신규) |
| Props | `icon` (LucideIcon), `title`, `description?`, `children?` (CTA 슬롯) |
| 적용 페이지 (5개) | payments, estimates, retrospective/postmortem, predict/avatars, projects |
| 패턴 | 아이콘 + 제목 + 설명 + CTA 버튼 (일부 페이지) |

#### A6 에러 바운더리

| 항목 | 내용 |
|---|---|
| 전역 404 | `src/app/not-found.tsx` — #FEEB00 "404" + 대시보드 링크 |
| 대시보드 에러 | `src/app/(dashboard)/error.tsx` — AlertTriangle 아이콘 + "다시 시도" 버튼 |
| 대시보드 404 | `src/app/(dashboard)/not-found.tsx` — #FEEB00 "404" + 대시보드 링크 |

#### 빌드 검증

```
next build → 성공 (에러 0건)
alert() 잔여 → 0건
```

### Phase B — 2026-02-28 완료

**커밋:** `38a37ec` (`ui: Phase B 대시보드 리디자인 — Bento 그리드 + 차트 위젯`)

> Phase B 상세 로그는 DEVLOG.md 참조

### Phase C — 2026-02-28 완료

**커밋:** `a7e1d82` (`ui: Phase C 테이블/목록 UX 강화 — 페이지네이션 + 정렬 + 카드 뷰`)
**변경:** 16 files, +851 / -219

#### C1 서버사이드 페이지네이션

| 항목 | 내용 |
|---|---|
| 공통 유틸 | `src/lib/pagination.ts` — `parsePaginationParams`, `parseSortParams`, `buildPaginationRange`, `buildSearchParamsString` |
| 공통 UI | `src/components/ui/pagination.tsx` — Link 기반 서버 컴포넌트, "1-20 / 총 64건" 형식 |
| 전략 | URL searchParams + Supabase `.range()` + `{ count: 'exact' }` |
| 적용 | 견적서, 결제, 프로젝트, 감사로그, 회의록, 스프린트 회고, 포스트모템 (7개 페이지) |

#### C2 컬럼 정렬

| 항목 | 내용 |
|---|---|
| 컴포넌트 | `src/components/ui/sortable-table-head.tsx` — Link 기반, ArrowUp/ArrowDown/ArrowUpDown 아이콘, 브랜드 컬러 활성 표시 |
| 견적서 | project_name, client_name, estimate_date, status |
| 결제 | name, amount, due_date (기본: due_date asc) |
| 프로젝트 | name, status, start_date |
| 감사로그 | created_at, table_name, action |
| 회의록 | title, meeting_date |
| 포스트모템 | severity, incident_date, created_at |

#### C3 행 호버 효과

| 항목 | 내용 |
|---|---|
| 파일 | `src/components/ui/table.tsx` |
| 변경 | `hover:bg-muted/50` → `hover:bg-brand-muted/50`, `data-[state=selected]:bg-muted` → `data-[state=selected]:bg-brand-muted` |

#### C4 카드 뷰 토글

| 항목 | 내용 |
|---|---|
| 토글 컴포넌트 | `src/components/ui/view-toggle.tsx` — LayoutList/LayoutGrid 아이콘, URL `view=table|card` |
| 카드 컴포넌트 | `src/components/ui/data-card.tsx` — 글래스 카드 스타일, `hover:border-brand/40 hover:shadow-md hover:scale-[1.01]` |
| 적용 | 견적서, 결제, 프로젝트 (3개 페이지) |
| 반응형 | 모바일(< md): 카드 기본 / 데스크톱: 테이블 기본 + 토글 가능 |

#### 수정 파일

**신규 (5개):** `pagination.ts`, `pagination.tsx`, `sortable-table-head.tsx`, `view-toggle.tsx`, `data-card.tsx`

**수정 (10개):** `table.tsx`, `estimates/page.tsx`, `payments/page.tsx`, `projects/page.tsx`, `settings/logs/page.tsx`, `audit-log-viewer.tsx`, `meetings/page.tsx`, `meeting-list-client.tsx`, `retrospective/sprint/page.tsx`, `retrospective/postmortem/page.tsx`

#### 이슈 & 해결

- Supabase PromiseLike `.catch()` 미지원 → 별도 `head: true` 병렬 count 쿼리로 교체

#### 테스트

- `next build` 에러 0건 ✅
- Chrome DevTools MCP 브라우저 직접 테스트 (라이트/다크 × 모바일/데스크톱 4조합) ✅
- 페이지네이션 네비게이션 (감사로그 2페이지 이동) ✅
- 정렬 토글 + URL searchParams 유지 ✅
- 카드/테이블 전환 데이터 일관성 ✅
- Phase C 관련 콘솔 에러/경고 0건 ✅

### 다음 작업: Phase D (폼 UX 개선)

- D1: 인라인 유효성 검사 (Zod 스키마)
- D2: Unsaved Changes 경고
- D3: 자동 저장 상태 표시
- D4: 키보드 단축키

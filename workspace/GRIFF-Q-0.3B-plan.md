# GRIFF-Q v0.3B — 킥오프 + GRIFF 스케줄

> v0.3 핵심 업무 엔진의 **보조 시스템 Phase**
> **상위 계획서:** `GRIFF-Q-0.3-plan.md`
> **선행 의존:** v0.3A (프로젝트/TASK 모듈 필요)

---

## 1) 목표

프로젝트 시작 절차를 체계화하는 **킥오프 시스템**과
회사 주요 일정을 관리하는 **캘린더 시스템**을 구축한다.

### 서브 모듈

| 모듈 | 설명 |
|---|---|
| **B1. 프로젝트 킥오프** | 목표/범위/R&R/체크리스트 + 숙지 확인 시스템 |
| **B2. GRIFF 스케줄** | FullCalendar 기반 캘린더 (월/주/일 뷰, 카테고리, 반복 일정) |

---

## 2) 기술 스택 추가

| 패키지 | 용도 |
|---|---|
| `@fullcalendar/react` | 캘린더 메인 |
| `@fullcalendar/daygrid` | 월간 뷰 |
| `@fullcalendar/timegrid` | 주간/일간 뷰 |
| `@fullcalendar/interaction` | 클릭/드래그 이벤트 |

---

## 3) DB 스키마

### 3-1. project_kickoffs 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects (1:1) |
| `objective` | text | 프로젝트 목표 |
| `scope` | text | 작업 범위 |
| `constraints` | text | 제약 조건 |
| `success_criteria` | text | 성공 기준 |
| `kickoff_date` | date | 킥오프 일자 |
| `status` | enum | `draft` / `in_progress` / `completed` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 3-2. kickoff_checklist_items 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `kickoff_id` | uuid | FK → project_kickoffs |
| `title` | text | 체크리스트 항목명 |
| `description` | text | 상세 설명 |
| `assignee_id` | uuid | FK → users |
| `is_completed` | boolean | 완료 여부 |
| `due_date` | date | 기한 |
| `sort_order` | integer | 정렬 순서 |

### 3-3. schedules 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | 일정명 |
| `description` | text | 설명 |
| `category` | enum | `vacation` / `salary_review` / `birthday` / `holiday` / `company` / `meeting` / `other` |
| `start_date` | date | 시작일 |
| `end_date` | date | 종료일 (nullable) |
| `is_all_day` | boolean | 종일 여부 |
| `start_time` | time | 시작 시간 |
| `end_time` | time | 종료 시간 |
| `recurrence` | enum | `none` / `yearly` / `monthly` / `weekly` |
| `color` | text | 표시 색상 |
| `created_by` | uuid | FK → users |
| `is_public` | boolean | 전사 공개 여부 |
| `target_user_id` | uuid | FK → users (nullable) |
| `created_at` | timestamptz | |

---

## 4) 페이지 구성

```
/projects/[id]/kickoff              # 킥오프 페이지

/schedule                           # 캘린더 메인
/schedule?view=month                # 월간 뷰 (기본)
/schedule?view=week                 # 주간 뷰
/schedule?view=day                  # 일간 뷰
```

---

## 5) 컴포넌트 설계

### 킥오프

```
src/components/kickoff/
├── kickoff-overview.tsx            # 프로젝트 개요 섹션
├── kickoff-team.tsx                # 팀 구성 + R&R + 숙지 확인
├── kickoff-milestones.tsx          # 마일스톤 타임라인
├── kickoff-checklist.tsx           # 체크리스트 (드래그 정렬)
├── kickoff-notes.tsx               # 킥오프 노트
└── kickoff-progress.tsx            # 킥오프 완료율 표시
```

### 스케줄

```
src/components/schedule/
├── schedule-calendar.tsx           # FullCalendar 래퍼
├── schedule-event-dialog.tsx       # 일정 생성/수정 다이얼로그
├── schedule-sidebar.tsx            # 카테고리 필터 + 미니 캘린더
├── schedule-event-card.tsx         # 일정 카드 (팝오버)
└── schedule-view-toggle.tsx        # 월/주/일 전환
```

### 타입

```
src/types/schedule.types.ts
```

---

## 6) 작업 목록

### B1. 프로젝트 킥오프

| # | 작업 | 난이도 | 예상 |
|---|---|---|---|
| B1-1 | project_kickoffs + kickoff_checklist_items 마이그레이션 | 낮음 | 2h |
| B1-2 | 킥오프 페이지 UI (개요/팀/마일스톤/체크리스트/노트) | 중간 | 8h |
| B1-3 | 종류별 기본 체크리스트 자동 생성 | 낮음 | 2h |
| B1-4 | 숙지 확인 기능 + PM 알림 | 낮음 | 2h |

### B2. GRIFF 스케줄

| # | 작업 | 난이도 | 예상 |
|---|---|---|---|
| B2-1 | schedules 테이블 마이그레이션 | 낮음 | 2h |
| B2-2 | FullCalendar 연동 (월/주/일 뷰) | 높음 | 10h |
| B2-3 | 일정 생성/수정 다이얼로그 | 중간 | 4h |
| B2-4 | 카테고리 필터 + 색상 시스템 | 낮음 | 2h |
| B2-5 | 반복 일정 처리 | 중간 | 3h |

### 합계: ~35h

---

## 7) 세부 설계

### 킥오프 페이지 구성

| 섹션 | 내용 |
|---|---|
| **프로젝트 개요** | 목표, 범위, 제약 조건, 성공 기준 |
| **팀 구성** | R&R 매핑 (project_members 연동), 숙지 확인 버튼 |
| **마일스톤** | 주요 일정 타임라인 (project_milestones 연동) |
| **체크리스트** | 담당자별 체크, 드래그 정렬, 자유 추가 |
| **킥오프 노트** | 자유 텍스트 메모 |

### 종류별 기본 체크리스트

| 종류 | 자동 생성 항목 |
|---|---|
| 일반 업무형 | 기획안 확정, 일정표 공유, R&R 확인, 커뮤니케이션 채널 설정 |
| 이벤트/행사형 | 장소 확정, 장비 리스트, 비상 연락망, 동선 확인, 리허설 일정 |
| 콘텐츠 제작형 | 레퍼런스 수집, 스크립트 초안, 촬영 일정, 편집 도구 확인 |
| 운영/유지보수형 | SLA 확인, 에스컬레이션 라인, 모니터링 도구, 복구 절차 |

### 캘린더 카테고리별 색상

| 카테고리 | 색상 | 아이콘 |
|---|---|---|
| 방학 | `#10B981` (그린) | Palmtree |
| 연봉협상 | `#F97316` (오렌지) | HandCoins |
| 생일 | `#EC4899` (핑크) | Cake |
| 공휴일 | `#EF4444` (레드) | CalendarOff |
| 회사 일정 | `#FEEB00` (브랜드) | Building2 |
| 회의 | `#3B82F6` (블루) | Users |
| 기타 | `#6B7280` (그레이) | Calendar |

---

## 8) 완료 기준

- [ ] 킥오프 페이지 5개 섹션 정상 표시
- [ ] 종류별 기본 체크리스트 자동 생성
- [ ] 체크리스트 CRUD + 드래그 정렬
- [ ] 숙지 확인 버튼 + PM 알림
- [ ] GRIFF 스케줄 월/주/일 뷰 전환
- [ ] 일정 CRUD + 카테고리 색상
- [ ] 반복 일정 표시
- [ ] 모바일 캘린더 터치 스와이프
- [ ] 라이트/다크 × 모바일/데스크톱 4조합 정상

---

## 9) 사용자 시나리오

> 구현 직전 상세 보강 예정. 현재는 골격만 기재.

### S-B1. PM이 킥오프를 진행한다

**플로우:** 프로젝트 상세 → 킥오프 탭 → 개요/팀/마일스톤/체크리스트 확인 → 팀원 숙지 요청 → 팀원 숙지 확인

**엣지 케이스:**
- 킥오프 없이 Task 시작: 허용, 미완료 배너 표시
- 팀원 변경 시: 새 팀원에게 숙지 요청 자동 발송
- PM이 체크리스트 자유 추가: 가능, 담당자 지정 필수

### S-B2. 팀원이 GRIFF 스케줄에서 일정을 확인한다

**플로우:** 사이드바 → 스케줄 → 월간 캘린더 → 일정 클릭 → 팝오버 상세 → 새 일정 추가

**엣지 케이스:**
- 반복 일정 수정: "이 일정만 / 이후 전체" 선택
- 개인 vs 전사: is_public + target_user_id로 구분
- 스크럼 연동: Phase C에서 시간 배치 시 자동 반영

---

## 10) 테스트 계획

| 시나리오 | 검증 항목 |
|---|---|
| 킥오프 생성 | 프로젝트 종류별 기본 체크리스트 자동 생성 |
| 체크리스트 CRUD | 항목 추가/체크/삭제/순서 변경 |
| 숙지 확인 | 버튼 클릭 → PM 알림 전송 |
| 캘린더 뷰 전환 | 월/주/일 정상 렌더링 |
| 일정 CRUD | 카테고리별 색상, 반복 일정 |
| 모바일 캘린더 | 375px 터치 스와이프 |

---

## 11) 영향받는 기존 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/constants.ts` | GRIFF 스케줄 메뉴 추가 |
| `src/components/layout/app-sidebar.tsx` | CalendarDays 아이콘 import |
| `src/components/layout/breadcrumb-nav.tsx` | /schedule, /kickoff 라벨 |
| `src/components/projects/project-hub-tabs.tsx` | 킥오프 탭 추가 |

---

## 12) 구현 로그

> Phase B 구현 시 작성 예정

| 날짜 | 작업 | 커밋 |
|---|---|---|
| - | - | - |

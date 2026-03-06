# GRIFF-Q v0.3A — 프로젝트 리워크 + TASK 모듈 + 의존성 맵 + AI 리뷰

> v0.3 핵심 업무 엔진의 **기반 Phase**
> **상위 계획서:** `GRIFF-Q-0.3-plan.md`

---

## 1) 목표

기존 프로젝트 모듈을 **업무 관리 허브**로 전면 재설계하고,
독립 TASK 관리 시스템 + 의존성 맵(DAG) + AI 리뷰를 구축한다.

### 서브 모듈

| 모듈 | 설명 |
|---|---|
| **A1. 프로젝트 리워크** | 6종 뷰 전환, R&R, 임무카드, 진행률 |
| **A2. TASK 모듈** | 독립 Task CRUD, Kanban, 필터 뷰, 서브태스크 |
| **A3. 태스크 의존성 맵** | React Flow 캔버스, DAG 순환 검증, 상태 전파, 크리티컬 패스 |
| **A4. AI 프로젝트 리뷰** | Gemini 대화형 질의, 주간/월간 보고서, 위험도 판정 |

---

## 2) 기술 스택 추가

| 패키지 | 용도 |
|---|---|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Kanban 보드 드래그 |
| `@xyflow/react` (React Flow) | 의존성 맵 DAG 캔버스 |
| `dagre` | DAG 자동 레이아웃 |

---

## 3) DB 스키마

### 3-1. projects 테이블 확장

| 컬럼 (신규) | 타입 | 설명 |
|---|---|---|
| `project_type` | enum | `general` / `event` / `content` / `maintenance` |
| `priority` | integer | 우선순위 (1~5) |
| `progress` | float | 진행률 (0~100, Task 가중치 기반 자동 계산) |
| `color` | text | 프로젝트 대표 색상 |
| `archived` | boolean | 아카이브 여부 |

### 3-2. project_members 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `user_id` | uuid | FK → users |
| `role` | enum | `pm` / `planner` / `designer` / `developer` / `video` / `operations` / `allrounder` |
| `is_backup` | boolean | 대체 담당자 여부 |
| `joined_at` | timestamptz | 참여 시점 |

### 3-3. project_milestones 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `title` | text | 마일스톤명 |
| `due_date` | date | 목표일 |
| `status` | enum | `pending` / `completed` |
| `sort_order` | integer | 정렬 순서 |

### 3-4. tasks 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects (nullable) |
| `title` | text | Task명 |
| `description` | text | 상세 설명 |
| `status` | enum | `pending` / `in_progress` / `review` / `completed` / `issue` |
| `priority` | enum | `urgent` / `high` / `normal` / `low` |
| `weight` | integer | 가중치 (1: 일반, 2: 핵심, 3: 마일스톤) |
| `assignee_id` | uuid | FK → users |
| `created_by` | uuid | FK → users |
| `due_date` | date | 마감일 |
| `estimated_hours` | float | 예상 소요시간 |
| `actual_hours` | float | 실제 소요시간 |
| `parent_task_id` | uuid | FK → tasks (서브태스크) |
| `milestone_id` | uuid | FK → project_milestones (nullable) |
| `source` | enum | `manual` / `meeting` / `scrum` / `kickoff` / `template` |
| `source_id` | uuid | 원본 참조 ID |
| `labels` | text[] | 라벨 태그 배열 |
| `sort_order` | integer | Kanban 정렬 |
| `node_position_x` | float | 의존성 맵 X좌표 |
| `node_position_y` | float | 의존성 맵 Y좌표 |
| `completed_at` | timestamptz | 완료 시점 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 3-5. task_dependencies 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `task_id` | uuid | FK → tasks (후행) |
| `depends_on_id` | uuid | FK → tasks (선행) |
| `dependency_type` | enum | `finish_to_start` / `start_to_start` / `finish_to_finish` |
| `created_at` | timestamptz | |

> **UNIQUE(task_id, depends_on_id)** — 중복 Edge 방지

### 3-6. project_reviews 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `review_type` | enum | `weekly` / `monthly` / `on_demand` |
| `generated_by` | text | AI 모델명 |
| `summary` | text | 요약 |
| `report_content` | jsonb | 구조화된 보고서 |
| `risk_level` | enum | `low` / `medium` / `high` / `critical` |
| `recommendations` | jsonb | AI 추천 배열 |
| `created_at` | timestamptz | |

### 3-7. project_review_conversations 테이블 (신규)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `user_id` | uuid | FK → users |
| `messages` | jsonb | [{role, content, timestamp}] |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## 4) 페이지 구성

```
/projects                           # 프로젝트 목록 (6종 뷰 전환)
/projects/new                       # 프로젝트 생성 (종류 선택 + R&R)
/projects/[id]                      # 프로젝트 상세 허브
/projects/[id]/tasks                # Task 목록 (프로젝트 내)
/projects/[id]/dependency-map       # 태스크 의존성 맵
/projects/[id]/timeline             # 타임라인 뷰
/projects/[id]/settings             # 프로젝트 설정

/projects/[id]/review               # AI 리뷰 허브
/projects/[id]/review/chat          # 실시간 대화형 질의
/projects/[id]/review/reports       # 보고서 목록
/projects/[id]/review/reports/[id]  # 보고서 상세

/tasks                              # 전체 Task 목록 (통합 뷰)
/tasks?filter=today                 # 오늘의 Task
/tasks?filter=upcoming              # 다가오는 Task
/tasks?filter=completed             # 완료된 Task
/tasks/[id]                         # Task 상세
```

---

## 5) 컴포넌트 설계

### 프로젝트

```
src/components/projects/
├── project-create-dialog.tsx       # 리워크 (종류 선택 + R&R 스텝)
├── project-hub-tabs.tsx            # 리워크 (탭 추가)
├── project-list-view.tsx           # List 뷰
├── project-board-view.tsx          # Board 뷰 (상태별 컬럼)
├── project-kanban-view.tsx         # Kanban 뷰 (Task 상태별)
├── project-calendar-view.tsx       # Calendar 뷰
├── project-gantt-view.tsx          # Gantt 뷰
├── project-view-toggle.tsx         # 뷰 전환 토글
├── project-progress-bar.tsx        # 진행률 바
├── project-member-manager.tsx      # R&R 멤버 관리
└── project-milestone-timeline.tsx  # 마일스톤 타임라인
```

### TASK

```
src/components/tasks/
├── task-create-dialog.tsx          # Task 생성 다이얼로그
├── task-detail-panel.tsx           # Task 상세 사이드 패널
├── task-list.tsx                   # List 뷰
├── task-board.tsx                  # Kanban 보드
├── task-filter-tabs.tsx            # All/Today/Upcoming/Completed/My 탭
├── task-priority-badge.tsx         # 우선순위 배지
├── task-status-select.tsx          # 상태 변경 셀렉트
└── subtask-list.tsx                # 서브태스크 체크리스트
```

### 의존성 맵

```
src/components/tasks/dependency-map/
├── dependency-map-canvas.tsx       # React Flow 메인 캔버스
├── task-node.tsx                   # 커스텀 노드
├── dependency-edge.tsx             # 커스텀 엣지 (화살표)
├── dependency-minimap.tsx          # 미니맵 + 줌 컨트롤
├── dependency-toolbar.tsx          # 노드 추가/자동 정렬/필터
├── dependency-overview.tsx         # 진행 현황 대시보드 패널
└── dag-validator.ts                # DAG 순환 참조 검증
```

### AI 리뷰

```
src/components/project-review/
├── review-chat.tsx                 # AI 대화 인터페이스
├── review-chat-message.tsx         # 메시지 버블
├── review-report-card.tsx          # 보고서 요약 카드
├── review-report-detail.tsx        # 보고서 상세
├── review-risk-badge.tsx           # 위험도 배지
├── review-recommendations.tsx      # AI 추천 카드
├── review-progress-chart.tsx       # 진행률 추이 차트
└── review-team-stats.tsx           # 팀원별 현황
```

### 타입/유틸

```
src/types/task.types.ts
src/lib/task-utils.ts               # 진행률 계산, DAG 유틸 등
```

---

## 6) 작업 목록

### A1. 프로젝트 리워크

| # | 작업 | 난이도 | 예상 |
|---|---|---|---|
| A1-1 | projects 테이블 확장 + project_members/milestones 마이그레이션 | 중간 | 4h |
| A1-2 | 프로젝트 메뉴 활성화 + 하위 메뉴 구성 | 낮음 | 1h |
| A1-3 | 프로젝트 목록 6종 뷰 전환 (List/Board/Kanban/Calendar/Gantt/Node) | 높음 | 12h |
| A1-4 | 프로젝트 생성 리워크 (종류 선택 + R&R 스텝) | 중간 | 6h |
| A1-5 | 프로젝트 상세 허브 탭 재구성 | 중간 | 4h |
| A1-6 | 진행률 자동 계산 (Task 가중치 기반) | 중간 | 3h |
| A1-7 | 임무카드 자동 발급 (종류별 Task 템플릿) | 중간 | 4h |

### A2. TASK 모듈

| # | 작업 | 난이도 | 예상 |
|---|---|---|---|
| A2-1 | tasks + task_dependencies 테이블 마이그레이션 | 중간 | 3h |
| A2-2 | Task CRUD + 상태 관리 | 중간 | 6h |
| A2-3 | Task 필터 탭 (All/Today/Upcoming/Completed/My) | 중간 | 4h |
| A2-4 | Task Kanban 보드 (dnd-kit 드래그) | 높음 | 8h |
| A2-5 | Task 상세 사이드 패널 | 중간 | 4h |
| A2-6 | 서브태스크 + 의존성 연결 | 중간 | 4h |
| A2-7 | 액션아이템 → Task 승격 기능 | 낮음 | 2h |

### A3. 태스크 의존성 맵

| # | 작업 | 난이도 | 예상 |
|---|---|---|---|
| A3-1 | React Flow 캔버스 + 커스텀 노드/엣지 | 높음 | 10h |
| A3-2 | DAG 순환 참조 검증 로직 | 중간 | 3h |
| A3-3 | 자동 정렬 (dagre 레이아웃) | 중간 | 4h |
| A3-4 | 상태 전파 시각화 (지연/완료/블로커) | 중간 | 4h |
| A3-5 | 필터/하이라이트 (담당자, 상태, 크리티컬 패스) | 중간 | 4h |
| A3-6 | 진행 현황 대시보드 (요약 카드 + 타임라인 + 알림) | 중간 | 6h |

### A4. AI 프로젝트 리뷰

| # | 작업 | 난이도 | 예상 |
|---|---|---|---|
| A4-1 | Gemini 연동 + 프로젝트 데이터 컨텍스트 구성 + 실시간 대화형 UI | 높음 | 10h |
| A4-2 | 주간/월간 보고서 자동 생성 | 높음 | 8h |
| A4-3 | 위험도 자동 판정 + 추천 사항 | 중간 | 4h |

### 합계: ~111h

---

## 7) 완료 기준

- [ ] 프로젝트 메뉴 활성화 + 6종 뷰 전환 동작
- [ ] 프로젝트 종류별 R&R + 임무카드 자동 발급
- [ ] Task CRUD + Kanban 보드 드래그 동작
- [ ] Task 필터 뷰 5종 (All/Today/Upcoming/Completed/My)
- [ ] 프로젝트 진행률 자동 계산
- [ ] 태스크 의존성 맵 (React Flow + DAG 순환 검증 + 상태 전파)
- [ ] 의존성 맵 진행 현황 대시보드
- [ ] AI 실시간 대화형 리뷰 (Gemini)
- [ ] AI 주간/월간 보고서 자동 생성
- [ ] 라이트/다크 × 모바일/데스크톱 4조합 정상
- [ ] 기존 기능 회귀 테스트 통과

---

## 8) 사용자 시나리오

> 구현 직전 상세 보강 예정. 현재는 골격만 기재.

### S-A1. PM이 새 프로젝트를 시작한다

**플로우:** 프로젝트 생성 → 종류 선택 → R&R 자동 로드 → 팀원 배정 → 임무카드/의존성 자동 생성

**엣지 케이스:**
- 종류 변경 시: 기존 유지, 새 템플릿은 "추가" 옵션
- 미배정 역할: "미배정" 표시 + 킥오프 경고
- 동일 팀원 다역할: 허용

### S-A2. PM이 의존성 맵에서 프로젝트를 파악한다

**플로우:** 캔버스 진입 → 노드/엣지 확인 → 진행 현황 패널 → 상태 전파 확인 → 노드 추가/연결

**엣지 케이스:**
- 노드 50개+: 미니맵 + 자동 정렬
- 독립 Task: 캔버스 하단 "독립 Task" 영역
- 모바일: 터치 줌/패닝만 (드래그 연결은 데스크톱 전용)

### S-A3. PM이 AI에게 프로젝트 상황을 질문한다

**플로우:** AI 리뷰 탭 → 대화 시작 → 질문 → 데이터 기반 답변 + 추천

**엣지 케이스:**
- 신규 프로젝트 (데이터 없음): 안내 메시지
- AI 응답 길 때: 스트리밍 출력
- 크로스 프로젝트 비교: 지원

### S-A4. 팀원이 Task를 관리한다

**플로우:** TASK 메뉴 → My Tasks → 상세 패널 → 서브태스크 체크 → 상태 전파

**엣지 케이스:**
- 서브태스크 없는 Task: 상태 기반 진행률 (0/50/100%)
- 선행 미완료 상태에서 진행: 경고만 표시, 허용
- Task 삭제 시: 연결 Edge 자동 삭제 + 후행 담당자 알림

### S-A5. PM이 주간 보고서를 확인한다

**플로우:** 금요일 자동 생성 → 알림 → 보고서 탭 → 7개 섹션 확인

**엣지 케이스:**
- (TODO: 구현 직전 보강)

---

## 9) 테스트 계획

### 테스트 루틴 (문제 0건까지 반복)

```
[구현 완료] → [Step 1] next build + lint 0건
            → [Step 2] 브라우저 4조합 (라이트/다크 × 모바일/데스크톱)
            → [Step 3] 이슈? YES→수정→Step1 / NO→PASS
```

### 시나리오별 검증 항목

| 시나리오 | 검증 항목 |
|---|---|
| 프로젝트 생성 (4종류) | 종류별 R&R 자동 생성, 임무카드 자동 발급 |
| 프로젝트 6종 뷰 전환 | List/Board/Kanban/Calendar/Gantt/Node 정상 렌더링 |
| Task CRUD | 생성/조회/수정/삭제/상태변경 |
| Task Kanban 드래그 | 상태 컬럼 간 드래그 이동 + DB 반영 |
| Task 필터 탭 전환 | All/Today/Upcoming/Completed/My 데이터 정확성 |
| 진행률 계산 | Task 완료 시 프로젝트 진행률 자동 업데이트 |
| 액션아이템 승격 | 회의록 액션아이템 → Task 변환 |
| 의존성 맵 캔버스 | React Flow 렌더링, 줌/패닝/미니맵 |
| 노드 연결 | 드래그 Edge 생성, 순환 참조 에러 차단 |
| 자동 정렬 | dagre 배치 시 겹침 없음 |
| 상태 전파 | 선행 완료/지연/이슈 시 후행 노드 시각 변경 |
| 크리티컬 패스 | 최장 경로 하이라이트 |
| 진행 현황 대시보드 | 요약 카드 수치, 도넛 차트, 담당자 부하 바 차트 |
| AI 대화형 리뷰 | 질문 → 실제 데이터 기반 답변 |
| AI 보고서 생성 | 주간 보고서 7개 섹션 출력 |
| 위험도 판정 | 지연 Task 추가 시 레벨 자동 변경 |

---

## 10) 영향받는 기존 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/constants.ts` | 프로젝트 메뉴 활성화, TASK 메뉴 추가 |
| `src/components/layout/app-sidebar.tsx` | 아이콘 import 추가 |
| `src/components/layout/breadcrumb-nav.tsx` | 새 경로 라벨 추가 |
| `src/app/(dashboard)/projects/*` | 프로젝트 전면 리워크 |
| `src/components/projects/*` | 컴포넌트 리워크 |
| `src/app/(dashboard)/meetings/action-items/page.tsx` | Task 승격 버튼 |

---

## 11) 구현 로그

> Phase A 구현 시 작성 예정

| 날짜 | 작업 | 커밋 |
|---|---|---|
| - | - | - |

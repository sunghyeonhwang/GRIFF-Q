# GRIFF-Q v0.3 — 핵심 업무 엔진

> "프로젝트/업무 관리 툴"로서의 정체성을 확립하는 버전
> **최종 업데이트: 2026-03-05**

---

## 0) 배경

v0.1~v0.25에서 회고/회의록/견적서/결제 등 **보조 모듈**은 완성되었으나,
정작 **프로젝트 관리 툴의 핵심**인 프로젝트·TASK·스크럼·스케줄이 부재하다.

v0.3은 이 핵심 축을 구축하여 GRIFF-Q를 **실무 업무 관리 도구**로 완성한다.

### 현재 상태

| 모듈 | 현재 | 문제점 |
|---|---|---|
| 프로젝트 | 기본 CRUD만 구현, 메뉴 비활성 | 뷰 전환 없음, Task 연결 없음, R&R 없음 |
| TASK | 회의록 액션아이템만 존재 | 독립 Task 없음, 필터 뷰 없음, 프로젝트 연결 없음 |
| 데일리 스크럼 | 없음 | 일일 업무 설계 시스템 부재 |
| 킥오프 | 없음 | 프로젝트 시작 절차 부재 |
| 스케줄 | 없음 | 회사 일정 관리 부재 |

---

## 1) v0.3 목표

> 프로젝트 → TASK → 스크럼 → 스케줄 핵심 축 구축

- 프로젝트 모듈 전면 리워크 (뷰 전환, 진행률, R&R, 임무카드)
- 독립 TASK 모듈 신설 (All/Today/Upcoming/Completed 필터)
- 데일리 스크럼 3단계 플로우 (브레인스토밍 → 우선순위 → 시간 배치)
- 프로젝트 킥오프 체크리스트
- GRIFF 스케줄 (회사 캘린더)

---

## 2) 기술 스택 추가

| 영역 | 패키지 | 용도 |
|---|---|---|
| 드래그 앤 드롭 | `@dnd-kit/core` + `@dnd-kit/sortable` | Kanban 보드, 우선순위 정렬, 타임블록 배치 |
| 노드 캔버스 | `@xyflow/react` (React Flow) | 태스크 의존성 맵 (DAG 시각화, 노드 연결, 미니맵) |
| 캘린더 | `@fullcalendar/react` + 플러그인 | GRIFF 스케줄, 시간 배치 뷰, Gantt 뷰 |
| AI 대화 | `@anthropic-ai/sdk` 또는 기존 Gemini | 데일리 스크럼 AI 대화형 수집 |
| 날짜 처리 | `date-fns` (기존) | 날짜 계산, 캘린더 로직 |

---

## 3) 모듈 구성 — 5개 모듈, 4 Phase

### 전체 모듈 맵

```
v0.3 핵심 업무 엔진
│
├─ Phase A: 프로젝트 + TASK (기반)
│   ├─ A1. 프로젝트 리워크
│   └─ A2. TASK 모듈
│
├─ Phase B: 킥오프 + 스케줄
│   ├─ B1. 프로젝트 킥오프
│   └─ B2. GRIFF 스케줄
│
├─ Phase C: 데일리 스크럼
│   └─ C1. 데일리 스크럼 3단계 플로우
│
└─ Phase D: 통합 + QA
    ├─ D1. 대시보드 연동
    ├─ D2. 사이드바/네비게이션 업데이트
    └─ D3. 전체 QA + 회귀 테스트
```

---

## 4) Phase A: 프로젝트 + TASK

### A1. 프로젝트 리워크

#### 목표
기존 프로젝트 모듈을 **업무 관리 허브**로 전면 재설계

#### 현재 → 변경

| 항목 | 현재 (v0.2) | 변경 (v0.3) |
|---|---|---|
| 메뉴 | disabled 상태 | **활성화** + 하위 메뉴 추가 |
| 목록 뷰 | List만 | **List / Board / Kanban / Calendar / Gantt** 5종 |
| 상세 | 개요 + 연결 데이터(견적/회의/회고/입금) 탭 | **개요 + Task + 타임라인 + 킥오프 + 설정** 탭 |
| 진행률 | 없음 | **Task 가중치 기반 자동 계산** |
| R&R | 없음 | **역할 템플릿 + 담당자 배정** |
| 임무카드 | 없음 | **프로젝트 종류별 자동 발급** |

#### DB 스키마 변경

**projects 테이블 확장**

| 컬럼 (신규) | 타입 | 설명 |
|---|---|---|
| `project_type` | enum | `general` / `event` / `content` / `maintenance` |
| `priority` | integer | 우선순위 (1~5) |
| `progress` | float | 진행률 (0~100, 자동 계산) |
| `color` | text | 프로젝트 대표 색상 |
| `archived` | boolean | 아카이브 여부 |

**project_members 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `user_id` | uuid | FK → users |
| `role` | enum | `pm` / `planner` / `designer` / `developer` / `video` / `operations` / `allrounder` |
| `is_backup` | boolean | 대체 담당자 여부 |
| `joined_at` | timestamptz | 참여 시점 |

**project_milestones 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `title` | text | 마일스톤명 |
| `due_date` | date | 목표일 |
| `status` | enum | `pending` / `completed` |
| `sort_order` | integer | 정렬 순서 |

#### 페이지 구성

```
/projects                           # 프로젝트 목록 (6종 뷰 전환)
/projects/new                       # 프로젝트 생성 (종류 선택 + R&R 설정)
/projects/[id]                      # 프로젝트 상세 허브
/projects/[id]/tasks                # Task 목록 (프로젝트 내)
/projects/[id]/dependency-map       # 태스크 의존성 맵 (React Flow 캔버스)
/projects/[id]/timeline             # 타임라인 뷰
/projects/[id]/kickoff              # 킥오프 체크리스트
/projects/[id]/settings             # 프로젝트 설정 (멤버, 역할, 상태)
```

#### 뷰 전환 상세

| 뷰 | 설명 | 기술 |
|---|---|---|
| **List** | 테이블 형태 (현재와 동일 + 진행률 바) | 기존 Table 컴포넌트 |
| **Board** | 상태별 컬럼 (active/completed/on_hold) | dnd-kit 드래그 |
| **Kanban** | Task 상태별 컬럼 (대기/진행/검토/완료/이슈) | dnd-kit 드래그 |
| **Calendar** | 월간 캘린더에 프로젝트 기간 표시 | FullCalendar |
| **Gantt** | 프로젝트별 타임라인 바 차트 | FullCalendar Timeline 플러그인 |
| **Node (의존성 맵)** | Task 간 선후 관계를 노드+화살표(DAG)로 시각화 | React Flow (@xyflow/react) |

#### 진행률 계산

```
Task 가중치: 일반(1) / 핵심(2) / 마일스톤(3)
진행률 = 완료 Task 가중치 합 / 전체 Task 가중치 합 × 100
```

#### R&R 역할 템플릿

| 프로젝트 종류 | 자동 생성 역할 |
|---|---|
| **일반 업무형** | PM, 기획, 디자인, 개발, 검수 |
| **이벤트/행사형** | PM, 기획, 현장운영, 장비관리, 비상대응 |
| **콘텐츠 제작형** | PM, 기획, 촬영, 편집, 검수 |
| **운영/유지보수형** | PM, 점검, 이슈처리, 복구, 리포트 |

#### 임무카드 자동 발급

프로젝트 생성 시 종류에 따라 기본 Task(임무카드)를 자동 생성:

| 종류 | 자동 생성 카드 |
|---|---|
| 일반 업무형 | 기획 / 제작 / 검수 / 배포 |
| 이벤트/행사형 | 사전준비 / 현장운영 / 철수정리 |
| 콘텐츠 제작형 | 아이디어 / 스크립트 / 촬영 / 편집 / 검수 / 게시 |
| 운영/유지보수형 | 점검 / 이슈처리 / 복구 / 리포트 |

---

### A2. TASK 모듈

#### 목표
기존 회의록 액션아이템을 확장하여 **독립 TASK 관리 시스템** 구축

#### DB 스키마

**tasks 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects (nullable: 프로젝트 무관 Task 허용) |
| `title` | text | Task명 |
| `description` | text | 상세 설명 |
| `status` | enum | `pending` / `in_progress` / `review` / `completed` / `issue` |
| `priority` | enum | `urgent` / `high` / `normal` / `low` |
| `weight` | integer | 가중치 (1: 일반, 2: 핵심, 3: 마일스톤) |
| `assignee_id` | uuid | FK → users (담당자) |
| `created_by` | uuid | FK → users (생성자) |
| `due_date` | date | 마감일 |
| `estimated_hours` | float | 예상 소요시간 (시간 단위) |
| `actual_hours` | float | 실제 소요시간 |
| `parent_task_id` | uuid | FK → tasks (상위 Task, 서브태스크용) |
| `milestone_id` | uuid | FK → project_milestones (nullable) |
| `source` | enum | `manual` / `meeting` / `scrum` / `kickoff` / `template` |
| `source_id` | uuid | 원본 참조 ID (회의록 ID, 스크럼 ID 등) |
| `labels` | text[] | 라벨 태그 배열 |
| `sort_order` | integer | Kanban 내 정렬 순서 |
| `completed_at` | timestamptz | 완료 시점 |
| `created_at` | timestamptz | 생성 시점 |
| `updated_at` | timestamptz | 수정 시점 |

**task_dependencies 테이블 (신규)** — 의존성 맵 Edge 데이터

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `task_id` | uuid | FK → tasks (후행 Task = target) |
| `depends_on_id` | uuid | FK → tasks (선행 Task = source) |
| `dependency_type` | enum | `finish_to_start` / `start_to_start` / `finish_to_finish` |
| `created_at` | timestamptz | 생성 시점 |

> **UNIQUE(task_id, depends_on_id)** — 중복 Edge 방지

tasks 테이블에 노드 위치 컬럼 추가:

| 컬럼 (신규) | 타입 | 설명 |
|---|---|---|
| `node_position_x` | float | 의존성 맵 캔버스 내 X 좌표 |
| `node_position_y` | float | 의존성 맵 캔버스 내 Y 좌표 |

#### 페이지 구성

```
/tasks                              # 전체 Task 목록 (통합 뷰)
/tasks?filter=today                 # 오늘의 Task
/tasks?filter=upcoming              # 다가오는 Task
/tasks?filter=completed             # 완료된 Task
/tasks/[id]                         # Task 상세
```

#### 필터 뷰

| 필터 | 조건 | 설명 |
|---|---|---|
| **All** | 전체 | 모든 Task (상태별 그룹) |
| **Today** | `due_date = today` 또는 `스크럼에서 오늘 배정` | 오늘 할 일 |
| **Upcoming** | `due_date > today` + `status != completed` | 다가오는 마감 |
| **Completed** | `status = completed` | 완료 아카이브 |
| **My Tasks** | `assignee_id = current_user` | 내 Task만 |

#### Task 상태 흐름

```
pending → in_progress → review → completed
                ↓           ↓
              issue      (재작업 → in_progress)
```

#### 기존 액션아이템 통합

- 기존 `action_items` 테이블 유지 (회의록 전용)
- 새 `tasks` 테이블이 상위 개념
- 회의록 액션아이템 → Task로 승격 기능 제공
- 통합 뷰에서 출처(source) 필터로 구분

#### 컴포넌트 설계

```
src/components/tasks/
├── task-create-dialog.tsx          # Task 생성 다이얼로그
├── task-detail-panel.tsx           # Task 상세 사이드 패널
├── task-list.tsx                   # List 뷰
├── task-board.tsx                  # Kanban 보드 뷰
├── task-filter-tabs.tsx            # All/Today/Upcoming/Completed 탭
├── task-priority-badge.tsx         # 우선순위 배지
├── task-status-select.tsx          # 상태 변경 셀렉트
├── subtask-list.tsx                # 서브태스크 체크리스트
└── dependency-map/                 # 태스크 의존성 맵 (React Flow)
    ├── dependency-map-canvas.tsx   # React Flow 메인 캔버스
    ├── task-node.tsx               # 커스텀 노드 컴포넌트
    ├── dependency-edge.tsx         # 커스텀 엣지 (화살표)
    ├── dependency-minimap.tsx      # 미니맵 + 줌 컨트롤
    ├── dependency-toolbar.tsx      # 노드 추가/자동 정렬/필터 툴바
    └── dag-validator.ts            # DAG 순환 참조 검증 로직
```

---

### A3. 태스크 의존성 맵 (Task Dependency Map)

#### 목표
여러 팀원이 참여하는 복잡한 프로젝트에서 **Task 간 선후 관계와 담당자를 직관적으로 파악**할 수 있는 노드 기반 캔버스 UI

#### 배경
- Gantt 차트는 '일정(시간)' 파악에 유리하나, 복잡하게 얽힌 업무의 **'의존성(Dependency)'과 '작업 흐름'**을 한눈에 파악하기에는 한계
- 노드(Node) 기반 캔버스에서 A → B → C 흐름을 화살표(Edge)로 연결하여 **워크플로우 시각화**

#### 핵심 자료구조: DAG (Directed Acyclic Graph)

```
Task 간 연결 = 방향성 있는 비순환 그래프 (DAG)

  ┌──────┐     ┌──────┐     ┌──────┐
  │ 기획  │────→│ 디자인│────→│ 개발  │
  └──────┘     └──────┘     └──┬───┘
                                │
  ┌──────┐                     ▼
  │ 콘텐츠 │────────────→┌──────┐
  └──────┘              │ 검수  │
                        └──────┘

순환 참조 금지: A → B → C → A (차단 + 에러 메시지)
```

#### 순환 참조 방지 로직

```typescript
// dag-validator.ts
// 새 Edge 추가 시 DFS/BFS로 순환 여부 검사
// source → target 연결 시도 시, target에서 source로 도달 가능하면 순환 → 차단
function wouldCreateCycle(
  edges: Edge[],
  newSource: string,
  newTarget: string
): boolean {
  // BFS: newTarget → ... → newSource 경로 존재 여부 확인
  // 존재하면 true (순환 발생) → 연결 차단 + toast.error
}
```

#### 캔버스 기능

| 기능 | 설명 | 기술 |
|---|---|---|
| **노드 배치** | 캔버스 위에서 Task 노드를 자유롭게 드래그 배치 | React Flow `onNodesChange` |
| **연결 생성** | 노드 핸들(포트)에서 드래그하여 의존성 Edge 생성 | React Flow `onConnect` |
| **연결 삭제** | Edge 클릭 → 삭제 확인 | React Flow `onEdgesChange` |
| **줌 인/아웃** | 마우스 휠 또는 버튼으로 줌 조절 | React Flow `Controls` |
| **패닝** | 빈 영역 드래그로 캔버스 이동 | React Flow 기본 |
| **미니맵** | 우측 하단 전체 구조 축소 뷰 | React Flow `MiniMap` |
| **자동 정렬** | 버튼 클릭 시 DAG 레이아웃 자동 배치 | dagre 라이브러리 연동 |
| **노드 추가** | 캔버스 내에서 바로 Task 생성 | 더블클릭 또는 툴바 버튼 |

#### 커스텀 노드 디자인

```
┌─────────────────────────────────┐
│  📋 인쇄소 견적 마무리            │ ← Task명
│  ─────────────────────────────  │
│  👤 김성현          🔴 긴급      │ ← 담당자 + 우선순위
│  📅 03/10          ⏱ 2h        │ ← 마감일 + 예상 소요
│  ████████░░ 진행중 (70%)        │ ← 상태 + 진행률 바
└──○────────────────────────○──┘
   ↑ input 핸들              ↑ output 핸들
```

| 요소 | 표시 내용 |
|---|---|
| **Task명** | 제목 (1줄 ellipsis) |
| **담당자** | 아바타 + 이름 |
| **우선순위** | 색상 배지 (긴급=빨강, 높음=주황, 보통=회색, 낮음=파랑) |
| **마감일** | 날짜 + D-day 표시 |
| **예상 소요** | 시간 단위 |
| **상태** | 프로그레스 바 + 상태 텍스트 |

#### 상태 전파 (State Propagation)

| 이벤트 | 시각적 반응 | 알림 |
|---|---|---|
| **선행 Task 지연** | 후행 노드 테두리 주황색 경고 + "선행 작업 지연" 라벨 | 후행 담당자에게 알림 |
| **선행 Task 완료** | 후행 노드 테두리 녹색 + "시작 가능" 라벨 | 후행 담당자에게 "시작 가능" 알림 |
| **선행 Task 이슈** | 후행 노드 테두리 빨간색 + "블로커" 라벨 | PM에게 에스컬레이션 |
| **모든 선행 완료** | 노드 배경 밝아짐 (활성화 표시) | — |

#### 필터/하이라이트

| 기능 | 설명 |
|---|---|
| **담당자 필터** | 특정 담당자의 노드만 하이라이트, 나머지 반투명 |
| **상태 필터** | 완료/진행중/대기 등 상태별 필터링 |
| **크리티컬 패스** | 가장 긴 의존성 경로를 빨간색으로 강조 (선택 기능) |
| **경로 추적** | 노드 클릭 시 해당 노드의 선행/후행 전체 경로 하이라이트 |

#### 진행 현황 대시보드 (Dependency Map Overview)

의존성 맵 상단 또는 사이드 패널에 **전체 노드 상태를 한눈에 파악**할 수 있는 현황 패널 제공.

##### 요약 카드

| 카드 | 내용 | 시각화 |
|---|---|---|
| **전체 진행률** | 완료 Task / 전체 Task (가중치 반영) | 원형 프로그레스 |
| **상태별 분포** | 대기 / 진행중 / 검토 / 완료 / 이슈 각 건수 | 도넛 차트 |
| **위험 지표** | 지연 Task 수 + 블로커 수 + 마감 임박 수 | 숫자 + 경고 색상 |
| **담당자별 부하** | 팀원별 할당 Task 수 + 완료율 | 수평 바 차트 |

##### 타임라인 뷰 (맵 하단)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
03/05       03/10       03/15       03/20       03/25
  │           │           │           │           │
  ├── 기획 ████████ ──┤           │           │
  │           ├── 디자인 ██████ ──┤           │
  │           │           ├── 개발 ████████ ──┤
  │     ├── 콘텐츠 ████████████ ─────────┤     │
  │           │           │           ├── 검수 ███ ──┤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- 의존성 맵과 동일한 데이터를 **시간축 기준**으로 표현
- 지연 Task는 빨간색 바로 표시
- Gantt 뷰와 연동 가능

##### 알림 센터 (맵 내)

| 알림 유형 | 트리거 조건 | 수신자 |
|---|---|---|
| **지연 경고** | 마감일 초과 + 미완료 | 담당자 + PM |
| **블로커 발생** | 선행 Task 이슈 상태 전환 | 후행 담당자 + PM |
| **시작 가능** | 모든 선행 Task 완료 | 후행 담당자 |
| **마감 임박** | D-2 이내 + 미완료 | 담당자 |
| **과부하** | 담당자 진행중 Task > 5건 | PM |

---

### A4. AI 프로젝트 리뷰 (Gemini 기반)

#### 목표
프로젝트 전체 데이터(Task 상태, 의존성, 일정, 담당자 부하)를 **Gemini AI가 분석**하여 **실시간 대화형 질의** + **정기 보고서 자동 생성** 제공

#### 기술 스택

| 항목 | 내용 |
|---|---|
| **AI 모델** | Google Gemini (기존 클라이언트 예측에서 사용 중) |
| **API** | Gemini 2.0 Flash (빠른 응답) / Gemini Pro (정기 보고서) |
| **데이터 소스** | tasks, task_dependencies, project_members, daily_scrums, schedules |

#### DB 스키마

**project_reviews 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `review_type` | enum | `weekly` / `monthly` / `on_demand` |
| `generated_by` | text | AI 모델명 (gemini-2.0-flash 등) |
| `summary` | text | 요약 (1~2줄) |
| `report_content` | jsonb | 구조화된 보고서 내용 |
| `risk_level` | enum | `low` / `medium` / `high` / `critical` |
| `recommendations` | jsonb | AI 추천 사항 배열 |
| `created_at` | timestamptz | 생성 시점 |

**project_review_conversations 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `user_id` | uuid | FK → users |
| `messages` | jsonb | 대화 기록 [{role, content, timestamp}] |
| `created_at` | timestamptz | 세션 시작 시점 |
| `updated_at` | timestamptz | 마지막 메시지 시점 |

#### 기능 1: 실시간 대화형 리뷰

> PM이 AI에게 프로젝트 상황을 질문하면, 실제 데이터 기반으로 답변

```
👤 PM: "이 프로젝트 지금 어떤 상황이야?"

🤖 AI: "현재 프로젝트 진행률은 42%입니다.
  - 전체 12개 Task 중 5개 완료, 4개 진행중, 3개 대기
  - ⚠️ '디자인 시안' Task가 2일 지연 중이며, 후행 작업
    '개발 착수'와 '콘텐츠 촬영'이 블로킹되고 있습니다.
  - 김성현님의 Task 부하가 가장 높습니다 (진행중 4건)
  - 추천: 디자인 시안에 추가 인력 배정을 검토해주세요."

👤 PM: "디자인 시안이 왜 지연되고 있어?"

🤖 AI: "'디자인 시안' Task 분석:
  - 담당: 박지원 (현재 진행중 Task 3건)
  - 예상 소요: 16h → 현재 22h 초과
  - 선행 Task '기획안 작성'이 1일 늦게 완료되어 시작이 지연
  - 서브태스크 3개 중 1개만 완료 상태
  - 추천: 마감일을 03/17로 조정하거나, 서브태스크 분담을 제안합니다."
```

##### AI 컨텍스트 구성 (프롬프트에 주입할 데이터)

| 데이터 | 소스 | 용도 |
|---|---|---|
| **Task 전체 목록** | tasks (해당 프로젝트) | 상태, 진행률, 담당자, 마감일 |
| **의존성 그래프** | task_dependencies | 블로커 분석, 크리티컬 패스 |
| **담당자 부하** | tasks GROUP BY assignee_id | 과부하 감지 |
| **일정 데이터** | schedules (해당 기간) | 회의/휴일 겹침 분석 |
| **스크럼 기록** | daily_scrums (최근 7일) | 팀 활동량 분석 |
| **마일스톤** | project_milestones | 전체 일정 대비 진척 |

#### 기능 2: 정기 보고서 자동 생성

##### 주간 보고서 (매주 금요일 자동 생성)

| 섹션 | 내용 |
|---|---|
| **1. 요약** | 이번 주 진행률 변화 (예: 32% → 48%, +16%p) |
| **2. 완료 Task** | 이번 주 완료된 Task 목록 + 담당자 |
| **3. 진행중 Task** | 현재 진행중인 Task + 예상 완료일 |
| **4. 위험 요소** | 지연 Task, 블로커, 마감 임박 항목 |
| **5. 담당자 현황** | 팀원별 완료/진행/대기 건수 |
| **6. AI 추천** | 일정 조정, 인력 재배정, 우선순위 변경 제안 |
| **7. 다음 주 전망** | 예상 진행률 + 주의 필요 Task |

##### 월간 보고서 (매월 말일 자동 생성)

| 섹션 | 내용 |
|---|---|
| **1. 월간 요약** | 진행률 추이 그래프 + 주요 성과 |
| **2. 마일스톤 현황** | 달성/미달성 마일스톤 |
| **3. 위험 분석** | 반복 지연 패턴, 병목 구간 식별 |
| **4. 팀 퍼포먼스** | 팀원별 완료율, 평균 처리시간 |
| **5. AI 인사이트** | 프로젝트 건강도 점수 + 개선 제안 |

##### 위험도 자동 판정

| 레벨 | 조건 | 표시 |
|---|---|---|
| 🟢 **Low** | 지연 0건, 진행률 계획 대비 90%+ | 녹색 |
| 🟡 **Medium** | 지연 1~2건 또는 진행률 70~90% | 노란색 |
| 🟠 **High** | 지연 3건+ 또는 블로커 존재 또는 진행률 50~70% | 주황색 |
| 🔴 **Critical** | 크리티컬 패스 지연 또는 진행률 50% 미만 | 빨간색 |

#### 페이지 구성

```
/projects/[id]/review               # AI 프로젝트 리뷰 (기존 페이지 리워크)
/projects/[id]/review/chat          # 실시간 대화형 질의
/projects/[id]/review/reports       # 보고서 목록 (주간/월간)
/projects/[id]/review/reports/[id]  # 보고서 상세
```

#### 컴포넌트 설계

```
src/components/project-review/
├── review-chat.tsx                 # AI 대화 인터페이스
├── review-chat-message.tsx         # 개별 메시지 버블
├── review-report-card.tsx          # 보고서 요약 카드
├── review-report-detail.tsx        # 보고서 상세 뷰
├── review-risk-badge.tsx           # 위험도 배지
├── review-recommendations.tsx      # AI 추천 사항 카드
├── review-progress-chart.tsx       # 진행률 추이 차트
└── review-team-stats.tsx           # 팀원별 현황
```

---

#### 페이지 구성 (전체)

```
/projects/[id]/dependency-map       # 프로젝트별 의존성 맵 (메인)
```

프로젝트 상세 허브의 탭으로도 접근 가능 (개요 / Task / **의존성 맵** / 타임라인 / 킥오프 / **AI 리뷰** / 설정)

---

## 5) Phase B: 킥오프 + 스케줄

### B1. 프로젝트 킥오프

#### 목표
프로젝트 시작 시 **팀원/일정/목표/체크리스트**를 체계적으로 설정하는 킥오프 시스템

#### DB 스키마

**project_kickoffs 테이블 (신규)**

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
| `created_at` | timestamptz | 생성 시점 |
| `updated_at` | timestamptz | 수정 시점 |

**kickoff_checklist_items 테이블 (신규)**

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

#### 페이지 구성

```
/projects/[id]/kickoff              # 킥오프 페이지
```

#### 킥오프 페이지 구성

| 섹션 | 내용 |
|---|---|
| **프로젝트 개요** | 목표, 범위, 제약 조건, 성공 기준 |
| **팀 구성** | R&R 매핑 (project_members 연동), 역할별 담당자 |
| **마일스톤** | 주요 일정 타임라인 (project_milestones 연동) |
| **체크리스트** | 시작 전 확인 항목 (담당자별 체크), 숙지 확인 버튼 |
| **킥오프 노트** | 킥오프 미팅 내용 메모 (자유 텍스트) |

#### 프로젝트 종류별 기본 체크리스트

| 종류 | 자동 생성 체크리스트 |
|---|---|
| 일반 업무형 | 기획안 확정, 일정표 공유, R&R 확인, 커뮤니케이션 채널 설정 |
| 이벤트/행사형 | 장소 확정, 장비 리스트 확인, 비상 연락망, 동선 확인, 리허설 일정 |
| 콘텐츠 제작형 | 레퍼런스 수집, 스크립트 초안, 촬영 일정, 편집 도구 확인 |
| 운영/유지보수형 | SLA 확인, 에스컬레이션 라인, 모니터링 도구, 복구 절차 |

#### 컴포넌트 설계

```
src/components/kickoff/
├── kickoff-overview.tsx            # 프로젝트 개요 섹션
├── kickoff-team.tsx                # 팀 구성 + R&R
├── kickoff-milestones.tsx          # 마일스톤 타임라인
├── kickoff-checklist.tsx           # 체크리스트 (드래그 정렬)
├── kickoff-notes.tsx               # 킥오프 노트
└── kickoff-progress.tsx            # 킥오프 완료율 표시
```

---

### B2. GRIFF 스케줄

#### 목표
회사 주요 일정을 관리하는 **캘린더 시스템**

#### DB 스키마

**schedules 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | 일정명 |
| `description` | text | 설명 |
| `category` | enum | `vacation` / `salary_review` / `birthday` / `holiday` / `company` / `meeting` / `other` |
| `start_date` | date | 시작일 |
| `end_date` | date | 종료일 (nullable: 당일 일정) |
| `is_all_day` | boolean | 종일 여부 |
| `start_time` | time | 시작 시간 (is_all_day=false일 때) |
| `end_time` | time | 종료 시간 |
| `recurrence` | enum | `none` / `yearly` / `monthly` / `weekly` |
| `color` | text | 캘린더 표시 색상 |
| `created_by` | uuid | FK → users |
| `is_public` | boolean | 전사 공개 여부 |
| `target_user_id` | uuid | FK → users (nullable: 개인 일정일 때) |
| `created_at` | timestamptz | 생성 시점 |

#### 페이지 구성

```
/schedule                           # 캘린더 메인
/schedule?view=month                # 월간 뷰 (기본)
/schedule?view=week                 # 주간 뷰
/schedule?view=day                  # 일간 뷰
```

#### 캘린더 뷰

| 뷰 | 설명 |
|---|---|
| **월간** | 전체 월 캘린더, 일정 도트/바 표시 (기본) |
| **주간** | 7일 타임라인, 시간대별 일정 블록 |
| **일간** | 하루 타임라인, 상세 일정 블록 |

#### 카테고리별 색상

| 카테고리 | 색상 | 아이콘 |
|---|---|---|
| 방학 | `#10B981` (그린) | Palmtree |
| 연봉협상 | `#F97316` (오렌지) | HandCoins |
| 생일 | `#EC4899` (핑크) | Cake |
| 공휴일 | `#EF4444` (레드) | CalendarOff |
| 회사 일정 | `#FEEB00` (브랜드) | Building2 |
| 회의 | `#3B82F6` (블루) | Users |
| 기타 | `#6B7280` (그레이) | Calendar |

#### 컴포넌트 설계

```
src/components/schedule/
├── schedule-calendar.tsx           # FullCalendar 래퍼
├── schedule-event-dialog.tsx       # 일정 생성/수정 다이얼로그
├── schedule-sidebar.tsx            # 카테고리 필터 + 미니 캘린더
├── schedule-event-card.tsx         # 일정 카드 (팝오버 상세)
└── schedule-view-toggle.tsx        # 월/주/일 전환
```

---

## 6) Phase C: 데일리 스크럼

### C1. 데일리 스크럼 3단계 플로우

#### 목표
매일 아침 **"오늘 하루를 설계"**하는 AI 대화형 시스템

> 참조: 기획서 부록 J 상세 기획

#### DB 스키마

**daily_scrums 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users |
| `scrum_date` | date | 스크럼 날짜 |
| `status` | enum | `not_started` / `brainstorming` / `prioritizing` / `scheduling` / `completed` |
| `ai_conversation` | jsonb | AI 대화 기록 |
| `completed_at` | timestamptz | 완료 시점 |
| `created_at` | timestamptz | 생성 시점 |

**scrum_items 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `scrum_id` | uuid | FK → daily_scrums |
| `title` | text | 할 일 항목명 |
| `priority` | enum | `urgent` / `important` / `normal` / `later` |
| `priority_order` | integer | 우선순위 정렬 순서 |
| `time_block_start` | time | 시간 배치 시작 |
| `time_block_end` | time | 시간 배치 끝 |
| `estimated_minutes` | integer | 예상 소요시간 (분) |
| `is_carried_over` | boolean | 어제 이월 항목 여부 |
| `source_task_id` | uuid | FK → tasks (nullable: 기존 Task 연결) |
| `generated_task_id` | uuid | FK → tasks (nullable: 스크럼 완료 후 생성된 Task) |
| `status` | enum | `planned` / `completed` / `skipped` |
| `sort_order` | integer | 정렬 순서 |

#### 페이지 구성

```
/scrum                              # 데일리 스크럼 메인 (오늘)
/scrum/history                      # 스크럼 기록
/scrum/history/[date]               # 특정 날짜 스크럼 상세
```

#### 3단계 플로우 상세

##### A단계: 브레인스토밍 — "오늘 뭘 해야 하지?"

| 기능 | 설명 |
|---|---|
| **AI 대화형 수집** | "오늘 뭘 해야 하나요?" → 자연어 대화로 할 일 추출 |
| **자동 이월** | 어제 미완료 Task → "어제 이것도 남았는데, 오늘 할까요?" 제안 |
| **프로젝트 연동** | 마감 임박 Task 자동 표시 |
| **자유 입력** | 대화 외 직접 항목 추가 |
| **회의 일정 반영** | 오늘 예정 회의 자동 표시 |
| **결과물** | Raw List (정리되지 않은 할 일 목록) |

##### B단계: 우선순위 정하기 — "뭐가 더 급하지?"

| 기능 | 설명 |
|---|---|
| **AI 자동 제안** | 마감일/프로젝트 중요도/의존성 기반 우선순위 추천 |
| **드래그 정렬** | dnd-kit으로 순서 변경 |
| **아이젠하워 매트릭스** | 긴급/중요 2×2 시각화 (선택적 뷰) |
| **라벨링** | 긴급(빨강) / 중요(주황) / 일반(회색) / 후순위(파랑) |
| **의존성 표시** | 선행 Task 연결 표시 |
| **결과물** | Prioritized List |

##### C단계: 시간 배치하기 — "언제 하지?"

| 기능 | 설명 |
|---|---|
| **타임블록** | 09:00~18:00 타임라인에 드래그 배치 |
| **예상 소요시간** | 15분 / 30분 / 1시간 / 2시간 / 반나절 선택 |
| **자동 배치 제안** | AI가 우선순위 + 소요시간 + 회의를 고려해 배치 추천 |
| **버퍼 타임** | 여유 시간 자동 확보 (설정 가능) |
| **과부하 경고** | 할당 시간 > 가용 시간 → 경고 |
| **캘린더 연동** | GRIFF 스케줄과 겹침 방지 |
| **결과물** | Today's Schedule |

#### 완료 후 자동화

| 자동화 | 내용 |
|---|---|
| **Task 자동 등록** | 스크럼 완성 시 각 항목 → Task에 자동 등록/수정 |
| **액션아이템 연결** | 기존 프로젝트/회의록 액션아이템과 자동 매핑 |
| **대시보드 반영** | "오늘의 흐름" 위젯에 스크럼 결과 표시 |

#### 미응답/미완료 처리

| 상황 | 대응 |
|---|---|
| 스크럼 미시작 | 오전 리마인드 알림 |
| A단계만 완료 | "우선순위를 정해주세요" 리마인드 |
| B단계까지 완료 | "시간 배치만 하면 완성!" 리마인드 |
| 전체 미응답 | PM에게 에스컬레이션 알림 |

#### 하루 마감 회고 (선택)

| 항목 | 내용 |
|---|---|
| **완료 체크** | 오늘 계획한 Task 중 완료/미완료 체크 |
| **미완료 사유** | 간단 사유 입력 (회의 길어짐, 긴급 요청 등) |
| **자동 이월** | 미완료 → 내일 스크럼 A단계 자동 제안 |
| **달성률** | 오늘 달성률 → 퍼포먼스 모듈 연동 (v0.6) |

#### 컴포넌트 설계

```
src/components/scrum/
├── scrum-stepper.tsx               # 3단계 스텝 인디케이터
├── scrum-brainstorm.tsx            # A단계: AI 대화 + 할 일 수집
├── scrum-ai-chat.tsx               # AI 대화 인터페이스
├── scrum-prioritize.tsx            # B단계: 드래그 정렬 + 매트릭스
├── scrum-eisenhower.tsx            # 아이젠하워 매트릭스 뷰
├── scrum-schedule.tsx              # C단계: 타임블록 배치
├── scrum-timeline.tsx              # 시간 타임라인 컴포넌트
├── scrum-summary.tsx               # 완료 요약 뷰
├── scrum-review.tsx                # 하루 마감 회고
└── scrum-carry-over.tsx            # 이월 항목 카드
```

---

## 7) Phase D: 통합 + QA

### D1. 대시보드 연동

현재 대시보드에 v0.3 모듈 위젯 추가:

| 위젯 | 내용 |
|---|---|
| **스크럼 상태** | 오늘 스크럼 완료/미완료 표시 + 바로가기 |
| **오늘의 Task** | 오늘 마감 Task 목록 (최대 5건) |
| **프로젝트 진행률** | 활성 프로젝트 진행률 바 |
| **오늘 일정** | GRIFF 스케줄에서 오늘 일정 요약 |

### D2. 사이드바 업데이트

```typescript
// constants.ts 변경 계획
MENU_ITEMS = [
  { title: "대시보드", url: "/dashboard", icon: LayoutDashboard },
  { title: "데일리 스크럼", url: "/scrum", icon: Sunrise },        // 신규
  { title: "TASK", url: "/tasks", icon: CheckSquare },              // 신규
  { title: "프로젝트", url: "/projects", icon: FolderKanban },      // 활성화 + 하위메뉴
  { title: "GRIFF 스케줄", url: "/schedule", icon: CalendarDays },  // 신규
  { title: "회고", url: "/retrospective", icon: MessageSquareText },
  { title: "회의록", url: "/meetings", icon: FileText },
  { title: "입금/결제", url: "/payments", icon: CreditCard },
  { title: "견적서", url: "/estimates", icon: Calculator },
  { title: "클라이언트 예측", url: "/predict", icon: Brain },
  { title: "설정", url: "/settings", icon: Settings },
];
```

### D3. 전체 QA

> v0.25 테스트 루틴 동일 적용 — 문제 0건까지 반복

---

## 8) 우선순위 매트릭스

### Phase A — 기반 (필수, 먼저)

| 작업 | 난이도 | 예상 |
|---|---|---|
| A1-1. projects 테이블 확장 + project_members/milestones | 중간 | 4h |
| A1-2. 프로젝트 메뉴 활성화 + 하위 메뉴 | 낮음 | 1h |
| A1-3. 프로젝트 목록 5종 뷰 전환 | 높음 | 12h |
| A1-4. 프로젝트 생성 리워크 (종류 선택 + R&R) | 중간 | 6h |
| A1-5. 프로젝트 상세 허브 탭 재구성 | 중간 | 4h |
| A1-6. 진행률 자동 계산 | 중간 | 3h |
| A1-7. 임무카드 자동 발급 | 중간 | 4h |
| A2-1. tasks 테이블 + task_dependencies 생성 | 중간 | 3h |
| A2-2. Task CRUD + 상태 관리 | 중간 | 6h |
| A2-3. Task 필터 탭 (All/Today/Upcoming/Completed/My) | 중간 | 4h |
| A2-4. Task Kanban 보드 (dnd-kit) | 높음 | 8h |
| A2-5. Task 상세 사이드 패널 | 중간 | 4h |
| A2-6. 서브태스크 + 의존성 | 중간 | 4h |
| A2-7. 액션아이템 → Task 승격 기능 | 낮음 | 2h |
| A3-1. React Flow 캔버스 + 커스텀 노드/엣지 | 높음 | 10h |
| A3-2. DAG 순환 참조 검증 로직 | 중간 | 3h |
| A3-3. 자동 정렬 (dagre 레이아웃) | 중간 | 4h |
| A3-4. 상태 전파 시각화 (지연/완료/블로커 표시) | 중간 | 4h |
| A3-5. 필터/하이라이트 (담당자, 상태, 크리티컬 패스) | 중간 | 4h |
| A3-6. 진행 현황 대시보드 (요약 카드 + 타임라인 + 알림) | 중간 | 6h |
| A4-1. AI 리뷰 — 실시간 대화형 (Gemini + 프로젝트 데이터 컨텍스트) | 높음 | 10h |
| A4-2. AI 리뷰 — 주간/월간 보고서 자동 생성 | 높음 | 8h |
| A4-3. AI 리뷰 — 위험도 자동 판정 + 추천 사항 | 중간 | 4h |

### Phase B — 보조 시스템

| 작업 | 난이도 | 예상 |
|---|---|---|
| B1-1. project_kickoffs + checklist 테이블 | 낮음 | 2h |
| B1-2. 킥오프 페이지 UI (개요/팀/마일스톤/체크리스트) | 중간 | 8h |
| B1-3. 종류별 기본 체크리스트 자동 생성 | 낮음 | 2h |
| B2-1. schedules 테이블 | 낮음 | 2h |
| B2-2. FullCalendar 연동 (월/주/일 뷰) | 높음 | 10h |
| B2-3. 일정 생성/수정 다이얼로그 | 중간 | 4h |
| B2-4. 카테고리 필터 + 색상 시스템 | 낮음 | 2h |

### Phase C — 데일리 스크럼

| 작업 | 난이도 | 예상 |
|---|---|---|
| C1-1. daily_scrums + scrum_items 테이블 | 중간 | 3h |
| C1-2. 3단계 스텝 UI 프레임 | 중간 | 4h |
| C1-3. A단계: AI 대화 + 자동 이월 + 자유 입력 | 높음 | 12h |
| C1-4. B단계: 드래그 정렬 + 아이젠하워 매트릭스 | 높음 | 8h |
| C1-5. C단계: 타임블록 배치 + 캘린더 연동 | 높음 | 10h |
| C1-6. 완료 시 Task 자동 등록 | 중간 | 4h |
| C1-7. 하루 마감 회고 | 낮음 | 3h |

### Phase D — 통합

| 작업 | 난이도 | 예상 |
|---|---|---|
| D1. 대시보드 위젯 4종 추가 | 중간 | 6h |
| D2. 사이드바 메뉴 업데이트 | 낮음 | 1h |
| D3. 전체 QA (4조합 테스트 + 회귀) | 중간 | 8h |

---

## 9) 개발 일정

```
Phase A: 프로젝트 + TASK (기반)
  │
  ├─ A1. 프로젝트 리워크
  │   ├─ DB 스키마 + 메뉴 활성화
  │   ├─ 목록 5종 뷰 전환
  │   ├─ 생성 리워크 (종류 + R&R)
  │   ├─ 상세 허브 + 진행률
  │   └─ 임무카드 자동 발급
  │
  ├─ A2. TASK 모듈
  │   ├─ DB 스키마 + CRUD
  │   ├─ 필터 탭 + Kanban 보드
  │   ├─ 상세 패널 + 서브태스크
  │   └─ 액션아이템 승격
  │
  ├─ A3. 태스크 의존성 맵
  │   ├─ React Flow 캔버스 + 커스텀 노드/엣지
  │   ├─ DAG 순환 참조 검증
  │   ├─ 자동 정렬 (dagre)
  │   ├─ 상태 전파 시각화
  │   ├─ 필터/하이라이트
  │   └─ 진행 현황 대시보드
  │
  └─ A4. AI 프로젝트 리뷰
      ├─ Gemini 연동 + 프로젝트 데이터 컨텍스트
      ├─ 실시간 대화형 질의
      ├─ 주간/월간 보고서 자동 생성
      └─ 위험도 판정 + 추천 사항
  │
  ▼
Phase B: 킥오프 + 스케줄
  │
  ├─ B1. 킥오프 체크리스트
  └─ B2. GRIFF 스케줄 (FullCalendar)
  │
  ▼
Phase C: 데일리 스크럼
  │
  ├─ C1. 3단계 플로우 UI
  ├─ AI 대화 + 이월 + 정렬
  ├─ 타임블록 배치
  └─ Task 자동 등록
  │
  ▼
Phase D: 통합 + QA
  │
  ├─ 대시보드 위젯
  ├─ 사이드바 업데이트
  └─ 전체 QA (문제 0건까지 반복)
```

### Git 운영

- 브랜치: `feature/v0.3-core-engine`
- 커밋 컨벤션: `feat:` 접두사 (예: `feat: Task 모듈 CRUD 구현`)
- Phase 단위 QA → 머지 → 다음 Phase

---

## 10) 영향받는 기존 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/constants.ts` | 메뉴 항목 추가/수정 (프로젝트 활성화, 스크럼/TASK/스케줄 신규) |
| `src/components/layout/app-sidebar.tsx` | 새 메뉴 아이콘 import |
| `src/components/layout/breadcrumb-nav.tsx` | 새 경로 라벨 매핑 추가 |
| `src/app/(dashboard)/dashboard/page.tsx` | 새 위젯 4종 추가 |
| `src/app/(dashboard)/projects/*` | 프로젝트 전면 리워크 |
| `src/components/projects/*` | 프로젝트 컴포넌트 전면 리워크 |
| `src/app/(dashboard)/meetings/action-items/page.tsx` | Task 승격 버튼 추가 |

---

## 11) 신규 파일 예상

### 페이지 (약 15개)

```
src/app/(dashboard)/tasks/page.tsx
src/app/(dashboard)/tasks/[id]/page.tsx
src/app/(dashboard)/tasks/loading.tsx
src/app/(dashboard)/tasks/error.tsx
src/app/(dashboard)/projects/new/page.tsx
src/app/(dashboard)/projects/[id]/tasks/page.tsx
src/app/(dashboard)/projects/[id]/dependency-map/page.tsx
src/app/(dashboard)/projects/[id]/review/page.tsx
src/app/(dashboard)/projects/[id]/review/chat/page.tsx
src/app/(dashboard)/projects/[id]/review/reports/page.tsx
src/app/(dashboard)/projects/[id]/review/reports/[id]/page.tsx
src/app/(dashboard)/projects/[id]/timeline/page.tsx
src/app/(dashboard)/projects/[id]/kickoff/page.tsx
src/app/(dashboard)/projects/[id]/settings/page.tsx
src/app/(dashboard)/schedule/page.tsx
src/app/(dashboard)/schedule/loading.tsx
src/app/(dashboard)/scrum/page.tsx
src/app/(dashboard)/scrum/history/page.tsx
src/app/(dashboard)/scrum/history/[date]/page.tsx
src/app/(dashboard)/scrum/loading.tsx
```

### 컴포넌트 (약 35개)

```
src/components/tasks/ (8개 + dependency-map/ 6개)
src/components/project-review/ (8개)
src/components/kickoff/ (6개)
src/components/schedule/ (5개)
src/components/scrum/ (10개)
src/components/dashboard/ (4개 — 신규 위젯)
```

### 유틸/타입 (약 5개)

```
src/types/task.types.ts
src/types/scrum.types.ts
src/types/schedule.types.ts
src/lib/task-utils.ts
src/lib/scrum-utils.ts
```

---

## 12) 테스트 계획

### 테스트 루틴 (모든 Phase 공통 — 문제 0건까지 반복)

```
[구현 완료]
     │
     ▼
[Step 1] 자동 테스트
     │  · next build — 빌드 에러 0건
     │  · next lint — lint 에러 0건
     │
     ▼
[Step 2] 브라우저 직접 테스트 (Chrome DevTools MCP)
     │  · 라이트/다크 × 모바일/데스크톱 4조합
     │  · 스크린샷 캡처 + 클릭 테스트
     │  · 콘솔 에러 확인
     │
     ▼
[Step 3] 이슈 발견?
     │
     ├─ YES → [수정] → Step 1로 돌아감
     └─ NO → PASS → 다음 Phase
```

### Phase별 테스트 시나리오

#### Phase A: 프로젝트 + TASK

| 시나리오 | 검증 항목 |
|---|---|
| 프로젝트 생성 (4종류) | 종류별 R&R 자동 생성, 임무카드 자동 발급 |
| 프로젝트 5종 뷰 전환 | List/Board/Kanban/Calendar/Gantt 정상 렌더링 |
| Task CRUD | 생성/조회/수정/삭제/상태변경 |
| Task Kanban 드래그 | 상태 컬럼 간 드래그 이동 + DB 반영 |
| Task 필터 탭 전환 | All/Today/Upcoming/Completed/My 데이터 정확성 |
| 진행률 계산 | Task 완료 시 프로젝트 진행률 자동 업데이트 |
| 액션아이템 승격 | 회의록 액션아이템 → Task 변환 |
| 의존성 맵 캔버스 | React Flow 렌더링, 줌/패닝/미니맵 정상 동작 |
| 노드 연결 | 드래그로 Edge 생성, 순환 참조 시 에러 메시지 차단 |
| 자동 정렬 | dagre 레이아웃 적용 시 겹침 없이 배치 |
| 상태 전파 | 선행 Task 완료/지연/이슈 시 후행 노드 시각 변경 |
| 크리티컬 패스 | 최장 경로 하이라이트 표시 |
| 진행 현황 대시보드 | 요약 카드 수치 정확성, 상태별 도넛 차트, 담당자 부하 바 차트 |
| AI 대화형 리뷰 | 프로젝트 상황 질문 → 실제 데이터 기반 답변 확인 |
| AI 보고서 생성 | 주간 보고서 수동 생성 → 7개 섹션 정상 출력 |
| 위험도 판정 | 지연 Task 추가 시 위험도 레벨 자동 변경 확인 |

#### Phase B: 킥오프 + 스케줄

| 시나리오 | 검증 항목 |
|---|---|
| 킥오프 생성 | 프로젝트 종류별 기본 체크리스트 자동 생성 |
| 체크리스트 CRUD | 항목 추가/체크/삭제/순서 변경 |
| 캘린더 뷰 전환 | 월/주/일 정상 렌더링 |
| 일정 CRUD | 카테고리별 색상 표시, 반복 일정 |
| 모바일 캘린더 | 375px에서 터치 스와이프 |

#### Phase C: 데일리 스크럼

| 시나리오 | 검증 항목 |
|---|---|
| A단계 브레인스토밍 | AI 대화 + 자유 입력 + 이월 제안 |
| B단계 우선순위 | 드래그 정렬 + 매트릭스 뷰 |
| C단계 시간 배치 | 타임블록 드래그 + 과부하 경고 |
| 스크럼 완료 → Task 생성 | 자동 Task 등록 확인 |
| 하루 마감 회고 | 완료 체크 + 미완료 이월 |

#### Phase D: 통합

| 시나리오 | 검증 항목 |
|---|---|
| 대시보드 위젯 | 스크럼/Task/프로젝트/일정 위젯 정상 표시 |
| 사이드바 메뉴 | 새 메뉴 5개 노출 + 네비게이션 |
| 기존 기능 회귀 | 회고/회의록/결제/견적서 정상 동작 |
| 다크모드 전체 | 새 페이지 전체 다크모드 확인 |
| 모바일 전체 | 새 페이지 전체 모바일 반응형 |

---

## 13) 완료 기준

- [ ] 프로젝트 메뉴 활성화 + 6종 뷰 전환 동작 (List/Board/Kanban/Calendar/Gantt/Node)
- [ ] 프로젝트 종류별 R&R + 임무카드 자동 발급
- [ ] 태스크 의존성 맵 (React Flow 캔버스 + DAG 순환 검증 + 상태 전파)
- [ ] 의존성 맵 진행 현황 대시보드 (요약 카드 + 타임라인 + 알림)
- [ ] AI 프로젝트 리뷰 — 실시간 대화형 질의 (Gemini)
- [ ] AI 프로젝트 리뷰 — 주간/월간 보고서 자동 생성
- [ ] Task CRUD + Kanban 보드 드래그 동작
- [ ] Task 필터 뷰 5종 (All/Today/Upcoming/Completed/My)
- [ ] 프로젝트 진행률 자동 계산
- [ ] 킥오프 체크리스트 + 종류별 기본 항목
- [ ] GRIFF 스케줄 캘린더 (월/주/일 뷰)
- [ ] 데일리 스크럼 3단계 플로우 동작
- [ ] 스크럼 완료 → Task 자동 등록
- [ ] 대시보드 위젯 4종 연동
- [ ] 사이드바 메뉴 업데이트
- [ ] 라이트/다크 × 모바일/데스크톱 4조합 정상
- [ ] 기존 기능 회귀 테스트 통과

---

## 14) 사용자 시나리오 (PM/팀원 관점)

### Phase A 시나리오

#### S-A1. PM이 새 프로젝트를 시작한다

```
[PM] 사이드바 → 프로젝트 → "+ 새 프로젝트"
  │
  ▼
[Step 1] 프로젝트 기본 정보 입력
  │  · 프로젝트명: "2026 여름 브랜딩 캠페인"
  │  · 종류 선택: 🎨 콘텐츠 제작형
  │  · 시작일/종료일, 우선순위, 프로젝트 색상
  │
  ▼
[Step 2] 종류 선택 시 자동 발생
  │  · R&R 템플릿 자동 로드: PM / 기획 / 촬영 / 편집 / 검수
  │  · 임무카드(Task) 자동 생성: 아이디어 / 스크립트 / 촬영 / 편집 / 검수 / 게시
  │  · 킥오프 체크리스트 자동 생성: 레퍼런스 수집 / 스크립트 초안 / 촬영 일정 / 편집 도구 확인
  │
  ▼
[Step 3] PM이 R&R에 팀원 배정
  │  · PM: 김성현
  │  · 기획: 박지원
  │  · 촬영: 이준호
  │  · 편집: 최다영
  │  · 검수: 김성현 (겸임)
  │
  ▼
[Step 4] 자동 생성된 Task에 담당자/마감일 배정
  │  · 아이디어 → 박지원, 03/10
  │  · 스크립트 → 박지원, 03/14
  │  · 촬영 → 이준호, 03/18
  │  · 편집 → 최다영, 03/22
  │  · 검수 → 김성현, 03/25
  │  · 게시 → 김성현, 03/27
  │
  ▼
[결과] 프로젝트 생성 완료
  · 프로젝트 목록에 표시 (진행률 0%)
  · 의존성 맵에 6개 노드 자동 배치 (아이디어→스크립트→촬영→편집→검수→게시)
  · 킥오프 페이지 접근 가능
  · 각 팀원에게 "새 프로젝트에 배정되었습니다" 알림
```

**엣지 케이스:**
- 종류를 나중에 변경하면? → 기존 R&R/임무카드 유지, 새 템플릿은 "추가" 옵션으로 제공 (덮어쓰기 아님)
- 팀원이 없는 역할이 있으면? → "미배정" 상태로 표시, 킥오프 체크리스트에 경고
- 동일 팀원이 여러 역할이면? → 허용 (김성현 = PM + 검수)

---

#### S-A2. PM이 의존성 맵에서 프로젝트 상황을 파악한다

```
[PM] 프로젝트 상세 → "의존성 맵" 탭 클릭
  │
  ▼
[캔버스 진입]
  · 6개 노드가 좌→우 방향으로 자동 배치되어 있음
  · 각 노드에 담당자 아바타 + 상태 + D-day 표시
  · 화살표로 선후 관계 연결됨
  │
  ▼
[현황 확인]
  · 상단 진행 현황 패널:
    - 전체 진행률: 33% (2/6 완료)
    - 상태: 완료 2 / 진행중 1 / 대기 3
    - ⚠️ 위험: "촬영" Task 마감 D-1 임박
    - 담당자 부하: 김성현(2건), 박지원(1건 완료), 이준호(1건 진행중), 최다영(1건 대기)
  │
  ▼
[상태 전파 확인]
  · "스크립트" 노드 = 완료(녹색) → "촬영" 노드 테두리 녹색 = "시작 가능"
  · "촬영" 노드 = 진행중(파랑) → "편집" 노드 = 대기(회색)
  · PM이 "촬영" 노드 클릭 → 경로 하이라이트: 스크립트 → [촬영] → 편집 → 검수 → 게시
  │
  ▼
[조작]
  · PM이 새 Task "섭외 확인" 노드 추가 (더블클릭)
  · "아이디어" → "섭외 확인" Edge 드래그 연결
  · "섭외 확인" → "촬영" Edge 드래그 연결
  · 순환 참조 시도: "게시" → "아이디어" 연결 시도 → ❌ "순환 참조가 발생합니다" 에러 toast
```

**엣지 케이스:**
- 노드가 50개 이상일 때? → 미니맵 필수, 자동 정렬 버튼으로 정리, 줌 아웃
- 의존성 없는 독립 Task? → 캔버스 하단에 "독립 Task" 영역에 배치
- 모바일에서 캔버스? → 터치 줌/패닝 지원, 노드 탭으로 상세 열기 (드래그 연결은 데스크톱 전용)

---

#### S-A3. PM이 AI에게 프로젝트 상황을 질문한다

```
[PM] 프로젝트 상세 → "AI 리뷰" 탭 → "대화" 클릭
  │
  ▼
[대화 시작]
  👤 PM: "이 프로젝트 지금 어떤 상황이야?"
  │
  🤖 AI: (내부적으로 tasks + dependencies + members + scrums 데이터 조회)
  │
  🤖 AI: "현재 '2026 여름 브랜딩 캠페인' 프로젝트 분석 결과:
  │
  │  📊 진행률: 33% (계획 대비 -7%p 지연)
  │
  │  ✅ 완료: 아이디어(박지원), 스크립트(박지원)
  │  🔄 진행중: 촬영(이준호) — D-1 마감 임박 ⚠️
  │  ⏳ 대기: 편집(최다영), 검수(김성현), 게시(김성현)
  │
  │  ⚠️ 위험 요소:
  │  1. 촬영 Task가 내일 마감인데 진행률 60% — 1~2일 지연 예상
  │  2. 촬영 지연 시 편집·검수·게시 연쇄 지연 (크리티컬 패스)
  │  3. 김성현님 검수+게시 2건 연속 — 병목 가능성
  │
  │  💡 추천:
  │  1. 촬영 마감일을 03/20으로 2일 연장 검토
  │  2. 편집 시작을 촬영 80% 시점부터 병렬 진행 가능한지 확인
  │  3. 게시 담당을 다른 팀원에게 분담 검토"
  │
  ▼
  👤 PM: "이준호 촬영 진행률이 왜 낮아?"
  │
  🤖 AI: (daily_scrums에서 이준호 최근 기록 조회)
  │
  🤖 AI: "이준호님의 최근 스크럼 기록 분석:
  │  · 03/15: 촬영 장소 변경으로 재섭외 필요 (예상 외 이슈)
  │  · 03/16: 장비 점검 + 새 장소 답사
  │  · 03/17: 촬영 시작, 2/5 씬 완료
  │
  │  원인: 장소 변경 이슈로 2일 손실
  │  예상 완료: 03/20 (2일 지연)"
```

**엣지 케이스:**
- 데이터가 없는 신규 프로젝트에서 질문? → "아직 충분한 데이터가 없습니다. Task 진행이 시작되면 분석이 가능합니다."
- AI 응답이 길어질 때? → 스트리밍 응답 (글자 단위 출력)
- 여러 프로젝트 비교 질문? → "프로젝트 A와 B 중 어느 쪽이 더 위험해?" 지원 (cross-project 컨텍스트)

---

#### S-A4. 팀원이 Task를 관리한다

```
[팀원: 이준호] 사이드바 → TASK
  │
  ▼
[Task 목록 — "My Tasks" 탭 자동 선택]
  │  ┌────────────────────────────────────────┐
  │  │ 📋 오늘 (1건)                            │
  │  │ ┌──────────────────────────────────────┐ │
  │  │ │ 🔴 촬영 — 여름 브랜딩 캠페인    D-1  │ │
  │  │ │ 진행중 ████████░░ 60%              │ │
  │  │ └──────────────────────────────────────┘ │
  │  │                                          │
  │  │ 📋 다가오는 (2건)                         │
  │  │ ┌──────────────────────────────────────┐ │
  │  │ │ ⚪ 장비 점검 — 운영 유지보수     03/25│ │
  │  │ │ ⚪ 현장 답사 — 가을 이벤트       03/28│ │
  │  │ └──────────────────────────────────────┘ │
  │  └────────────────────────────────────────┘
  │
  ▼
[이준호가 "촬영" Task 클릭 → 상세 사이드 패널 열림]
  │  · 제목: 촬영
  │  · 프로젝트: 2026 여름 브랜딩 캠페인
  │  · 상태: 진행중 → [완료로 변경] 버튼
  │  · 서브태스크:
  │    ✅ 씬 1~2 촬영
  │    ☐ 씬 3~4 촬영
  │    ☐ 씬 5 촬영 + 보정
  │  · 선행 Task: 스크립트 (✅ 완료)
  │  · 후행 Task: 편집 (⏳ 대기 — 내가 끝나야 시작)
  │  · 메모 입력란
  │
  ▼
[이준호가 서브태스크 "씬 3~4 촬영" 체크 → 진행률 80%로 갱신]
  │
  ▼
[상태 전파]
  · 프로젝트 진행률 자동 업데이트
  · 의존성 맵에서 "촬영" 노드 진행률 바 갱신
```

**엣지 케이스:**
- Task에 서브태스크가 없으면? → 진행률 = 상태 기반 (대기 0%, 진행중 50%, 완료 100%)
- 선행 Task가 미완료인데 "진행중"으로 바꾸려면? → 허용 (경고만 표시: "선행 Task '스크립트'가 아직 완료되지 않았습니다")
- Task를 삭제하면 의존성은? → 연결된 Edge 자동 삭제 + 후행 Task에 "선행 Task 삭제됨" 알림

---

#### S-A5. PM이 주간 보고서를 확인한다

```
[매주 금요일 18:00 — 자동 생성]
  │
  ▼
[PM에게 알림] "주간 프로젝트 리뷰 보고서가 생성되었습니다"
  │
  ▼
[PM] 프로젝트 상세 → AI 리뷰 → 보고서 탭
  │
  │  ┌─────────────────────────────────────────────┐
  │  │ 📊 주간 보고서 — 03/10 ~ 03/14               │
  │  │                                               │
  │  │ 요약: 진행률 18% → 33% (+15%p)               │
  │  │ 위험도: 🟡 Medium (지연 1건)                   │
  │  │                                               │
  │  │ ✅ 이번 주 완료 (2건)                          │
  │  │   · 아이디어 — 박지원 (03/10)                  │
  │  │   · 스크립트 — 박지원 (03/14)                  │
  │  │                                               │
  │  │ 🔄 진행중 (1건)                               │
  │  │   · 촬영 — 이준호 (60%, 마감 03/18)           │
  │  │                                               │
  │  │ ⚠️ 위험 요소                                  │
  │  │   · 촬영 Task D-1 임박, 60% 진행 → 지연 예상  │
  │  │   · 크리티컬 패스: 촬영→편집→검수→게시 연쇄 영향│
  │  │                                               │
  │  │ 💡 AI 추천                                    │
  │  │   1. 촬영 마감 2일 연장 (03/18 → 03/20)       │
  │  │   2. 편집 선행 조건을 "촬영 80%" 로 완화 검토   │
  │  │   3. 게시 담당 분산 검토 (김성현 부하 2건)      │
  │  │                                               │
  │  │ 📈 다음 주 전망                                │
  │  │   · 예상 진행률: 33% → 50%                    │
  │  │   · 촬영 완료 + 편집 착수 예상                  │
  │  └─────────────────────────────────────────────┘
```

---

### Phase B 시나리오

#### S-B1. PM이 킥오프를 진행한다

```
[PM] 프로젝트 상세 → "킥오프" 탭
  │
  ▼
[킥오프 페이지 — 상태: 진행중]
  │
  │  ┌─ 프로젝트 개요 ─────────────────────────────┐
  │  │ 목표: 여름 시즌 브랜딩 콘텐츠 제작             │
  │  │ 범위: 영상 5건 + 사진 20건                    │
  │  │ 제약: 예산 500만원, 외부 모델 1명              │
  │  │ 성공 기준: 클라이언트 최종 승인 03/27까지       │
  │  └───────────────────────────────────────────┘
  │
  │  ┌─ 팀 구성 (R&R) ──────────────────────────────┐
  │  │ PM: 김성현 ✅ 숙지                            │
  │  │ 기획: 박지원 ✅ 숙지                           │
  │  │ 촬영: 이준호 ⏳ 미확인                         │
  │  │ 편집: 최다영 ⏳ 미확인                         │
  │  │ 검수: 김성현 ✅ 숙지                           │
  │  └───────────────────────────────────────────┘
  │
  │  ┌─ 마일스톤 ──────────────────────────────────┐
  │  │ ○── 기획 확정 (03/10) ──○── 촬영 완료 (03/18)│
  │  │ ──○── 편집 완료 (03/22) ──○── 최종 검수 (03/27)│
  │  └───────────────────────────────────────────┘
  │
  │  ┌─ 체크리스트 ─────────────── 완료 3/5 (60%) ──┐
  │  │ ✅ 레퍼런스 수집 — 박지원                      │
  │  │ ✅ 스크립트 초안 — 박지원                      │
  │  │ ✅ 편집 도구 확인 — 최다영                     │
  │  │ ☐ 촬영 일정 확정 — 이준호                     │
  │  │ ☐ 장비 리스트 확인 — 이준호                   │
  │  └───────────────────────────────────────────┘
  │
  ▼
[이준호가 로그인 → "킥오프 미확인" 알림 클릭]
  · 킥오프 페이지 진입 → 내용 확인 → "숙지 확인" 버튼 클릭
  · 체크리스트에서 "촬영 일정 확정" 체크
  · PM에게 "이준호가 킥오프를 숙지했습니다" 알림
```

**엣지 케이스:**
- 킥오프 없이 Task를 시작하면? → 허용하되, 킥오프 미완료 배너 표시: "킥오프 체크리스트가 완료되지 않았습니다"
- 킥오프 후 팀원이 변경되면? → R&R에서 수정 가능, 새 팀원에게 숙지 요청 자동 발송
- 체크리스트 항목을 PM이 추가하면? → 자유 추가 가능, 담당자 지정 필수

---

#### S-B2. 팀원이 GRIFF 스케줄에서 일정을 확인한다

```
[팀원] 사이드바 → GRIFF 스케줄
  │
  ▼
[월간 캘린더 뷰 — 3월]
  │
  │  ┌─ 3월 ──────────────────────────────────────┐
  │  │ 월    화    수    목    금    토    일       │
  │  │                              1     2       │
  │  │ 3     4     5     6     7     8     9       │
  │  │       🟢방학                                │
  │  │ 10    11    12    13    14    15    16      │
  │  │ 🔵미팅               🔴3·1절                │
  │  │ 17    18    19    20    21    22    23      │
  │  │                     🟠연봉                   │
  │  │ 24    25    26    27    28    29    30      │
  │  │                               🎂성현        │
  │  │ 31                                         │
  │  └───────────────────────────────────────────┘
  │
  ▼
[03/10 "클라이언트 미팅" 클릭 → 팝오버]
  │  · 제목: A사 브랜딩 미팅
  │  · 시간: 14:00~15:30
  │  · 카테고리: 🔵 회의
  │  · 참석자: 김성현, 박지원
  │
  ▼
[새 일정 추가: "+ 일정" 버튼]
  │  · 제목: "여름 촬영 D-day"
  │  · 날짜: 03/18
  │  · 카테고리: 회사 일정
  │  · 종일 여부: 예
  │  · 반복: 없음
```

**엣지 케이스:**
- 반복 일정 (매주/매월/매년)? → recurrence 필드로 자동 표시, 수정 시 "이 일정만 / 이후 전체" 선택
- 개인 일정 vs 전사 일정? → is_public=true(전사), target_user_id 지정(개인). 내 캘린더에서 둘 다 표시, 색상으로 구분
- 스케줄과 스크럼 연동? → C단계(시간 배치)에서 오늘 일정 자동 반영, 겹침 방지

---

### Phase C 시나리오

#### S-C1. 팀원이 아침 데일리 스크럼을 진행한다

```
[팀원: 이준호] 로그인 → 대시보드에 "오늘 스크럼 미완료" 배너
  │  → "스크럼 시작" 클릭
  │
  ▼
[A단계: 브레인스토밍 — "오늘 뭘 해야 하지?"]
  │
  │  🤖 AI: "안녕하세요 이준호님! 오늘 해야 할 일을 정리해볼까요?"
  │
  │  🤖 AI: "어제 미완료된 항목이 있어요:
  │        · 씬 3~4 촬영 (어제 남음)
  │        오늘 이어서 할까요?"
  │
  │  👤 이준호: "응, 그리고 오늘 씬 5도 찍어야 해. 그리고 장비 반납도."
  │
  │  🤖 AI: "정리했어요!
  │        · 씬 3~4 촬영 (이월)
  │        · 씬 5 촬영 + 보정
  │        · 장비 반납
  │        더 추가할 게 있나요?"
  │
  │  👤 이준호: (직접 추가) "+ 편집팀에 소스 전달"
  │
  │  [현재 Raw List: 4건]
  │  → [다음: 우선순위 →] 버튼 클릭
  │
  ▼
[B단계: 우선순위 — "뭐가 더 급하지?"]
  │
  │  AI가 자동 제안한 순서:
  │  1. 🔴 씬 3~4 촬영 (마감 D-0, 프로젝트 크리티컬)
  │  2. 🔴 씬 5 촬영 + 보정 (마감 D-0)
  │  3. 🟠 편집팀에 소스 전달 (후행 Task 블로킹)
  │  4. ⚪ 장비 반납 (긴급하지 않음)
  │
  │  이준호가 드래그로 순서 조정:
  │  1. 씬 3~4 촬영
  │  2. 씬 5 촬영 + 보정
  │  3. 편집팀에 소스 전달  ← 3, 4 순서 바꿈
  │  4. 장비 반납
  │
  │  [아이젠하워 매트릭스 뷰 토글 가능]
  │  ┌────────────┬────────────┐
  │  │  긴급+중요   │  중요       │
  │  │  씬 3~4     │            │
  │  │  씬 5       │            │
  │  ├────────────┼────────────┤
  │  │  긴급       │  나중에     │
  │  │  소스 전달   │  장비 반납  │
  │  └────────────┴────────────┘
  │
  │  → [다음: 시간 배치 →] 클릭
  │
  ▼
[C단계: 시간 배치 — "언제 하지?"]
  │
  │  ┌─ 오늘 타임라인 (09:00 ~ 18:00) ──────────┐
  │  │                                           │
  │  │ 09:00 ┃████ 씬 3~4 촬영 (2h)             │
  │  │ 10:00 ┃████                               │
  │  │ 11:00 ┃████ 씬 5 촬영 + 보정 (2h)        │
  │  │ 12:00 ┃████                               │
  │  │ 12:00 ┃░░░░ 점심 (자동 블록)              │
  │  │ 13:00 ┃                                   │
  │  │ 14:00 ┃▓▓▓▓ [A사 미팅 — 스케줄 자동 표시] │
  │  │ 15:00 ┃                                   │
  │  │ 15:30 ┃████ 편집팀 소스 전달 (30min)      │
  │  │ 16:00 ┃████ 장비 반납 (1h)                │
  │  │ 17:00 ┃░░░░ 버퍼 타임                     │
  │  │ 18:00 ┃                                   │
  │  │                                           │
  │  │ ⚠️ 총 5.5h / 가용 7h — 여유 있음          │
  │  └───────────────────────────────────────────┘
  │
  │  · GRIFF 스케줄의 "A사 미팅 14:00~15:30"이 자동 블록
  │  · 이준호가 "씬 5"를 드래그해서 오후로 이동 가능
  │  · 과부하 시: "⚠️ 오늘 다 못 끝낼 수 있어요 (8h > 가용 7h)"
  │
  │  → [✅ 스크럼 완성] 클릭
  │
  ▼
[완료 시 자동화]
  · 4개 항목 → Task 자동 생성/업데이트
    - "씬 3~4 촬영": 기존 서브태스크와 매핑 → 상태 갱신
    - "씬 5 촬영 + 보정": 기존 서브태스크와 매핑
    - "편집팀에 소스 전달": 새 Task 생성 (source: scrum)
    - "장비 반납": 새 Task 생성 (source: scrum)
  · 대시보드 "오늘의 흐름" 위젯에 반영
  · PM에게 "이준호가 스크럼을 완료했습니다" 알림
```

**엣지 케이스:**
- AI 대화 없이 직접 입력만 하고 싶으면? → A단계에서 "직접 입력 모드" 토글 가능 (AI 대화 건너뛰기)
- C단계 없이 B까지만 하고 완료하고 싶으면? → 허용하되 "시간 배치 미완료" 상태로 표시, 스크럼은 "부분 완료"
- 오후에 스크럼을 시작하면? → 허용, 시간 배치에서 현재 시각 이후만 가용 시간으로 표시
- 스크럼에서 만든 Task가 이미 있는 Task와 중복이면? → AI가 "기존 Task '촬영'의 서브태스크로 연결할까요?" 제안

---

#### S-C2. 팀원이 하루를 마감한다

```
[팀원: 이준호] 저녁 → 대시보드 "하루 마감 회고" 카드 클릭
  │  (또는 스크럼 페이지 → "마감 회고" 탭)
  │
  ▼
[마감 회고]
  │
  │  오늘의 계획 (4건):
  │  ✅ 씬 3~4 촬영 — 완료
  │  ✅ 씬 5 촬영 + 보정 — 완료
  │  ✅ 편집팀에 소스 전달 — 완료
  │  ☐ 장비 반납 — 미완료
  │
  │  [미완료 사유 입력]
  │  · 장비 반납: "반납처 마감 시간 지남, 내일 오전 처리"
  │
  │  → [마감 완료] 클릭
  │
  ▼
[자동화]
  · "장비 반납" → 내일 스크럼 A단계에 자동 이월 제안
  · 오늘 달성률: 75% (3/4 완료) → 추후 퍼포먼스 모듈(v0.6) 연동
  · Task 상태 자동 업데이트:
    - "촬영" Task 서브태스크 전부 완료 → Task 상태 "완료"로 변경
    - 의존성 맵에서 "촬영" 노드 → 녹색(완료)
    - "편집" 노드 → "시작 가능" 상태 전파
    - 최다영에게 "편집 Task를 시작할 수 있습니다" 알림
```

**엣지 케이스:**
- 마감 회고를 안 하면? → 다음 날 스크럼 시작 시 "어제 마감 회고를 하지 않았습니다" 안내, 어제 Task 상태 기준으로 자동 이월
- 계획에 없던 Task를 오늘 처리했으면? → "오늘 추가로 완료한 Task가 있나요?" 입력란 제공
- 여러 프로젝트의 Task가 섞여 있으면? → 프로젝트별 그룹으로 표시, 각각 달성률 표시

---

#### S-C3. PM이 팀 스크럼 현황을 모니터링한다

```
[PM] 대시보드 → "데일리 스크럼" 위젯
  │
  │  ┌─ 오늘의 스크럼 현황 ──────────────────────┐
  │  │                                           │
  │  │ ✅ 김성현 — 완료 (4건 계획, 달성률 100%)    │
  │  │ ✅ 박지원 — 완료 (3건 계획, 달성률 80%)     │
  │  │ 🔄 이준호 — 진행중 (A단계)                  │
  │  │ ❌ 최다영 — 미시작                          │
  │  │                                           │
  │  │ 팀 스크럼 완료율: 50% (2/4)                │
  │  └───────────────────────────────────────────┘
  │
  ▼
[PM이 최다영 이름 클릭 → 리마인드 발송]
  · "최다영님, 오늘 스크럼을 시작해주세요" 알림 전송
```

---

## 15) 후속 버전 참조

| 버전 | 내용 | v0.3 의존성 |
|---|---|---|
| **v0.4** | 대시보드 개편 (탭 전환 + 위젯 8종), 세팅 (개인정보) | 대시보드에 프로젝트/Task/스크럼 위젯 필요 |
| **v0.5** | 견적서 고도화 4종 + 결제 대량전송 + 계산서 + 클라이언트 포털 | 독립적 |
| **v0.6** | 퍼포먼스 + 뉴스 큐레이션 + 아카이빙 | Task 달성률 데이터 필요 |

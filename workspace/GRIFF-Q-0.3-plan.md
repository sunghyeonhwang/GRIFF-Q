# GRIFF-Q v0.3 — 핵심 업무 엔진

> "프로젝트/업무 관리 툴"로서의 정체성을 확립하는 버전
> **최종 업데이트: 2026-03-06**
> **참조 문서: GRIFF-Q-0.3-scenarios.md (시나리오 & 역할 정의서)**

---

## 0) 배경

v0.1~v0.25에서 회고/회의록/견적서/결제 등 **보조 모듈**은 완성되었으나,
정작 **프로젝트 관리 툴의 핵심**인 프로젝트·TASK·스크럼·스케줄이 부재하다.

v0.3은 이 핵심 축을 구축하여 GRIFF-Q를 **실무 업무 관리 도구**로 완성한다.

### 현재 상태

| 모듈 | 현재 | 문제점 |
|---|---|---|
| 프로젝트 | 기본 CRUD만 구현, 메뉴 비활성 | 뷰 전환 없음, 태스크 연결 없음, R&R 없음 |
| 태스크 | 회의록 액션아이템만 존재 | 독립 태스크 없음, 필터 뷰 없음, 프로젝트 연결 없음 |
| 데일리 스크럼 | 없음 | 일일 업무 설계 시스템 부재 |
| 킥오프 | 없음 | 프로젝트 시작 절차 부재 |
| 일정 | 없음 | 회사 일정 관리 부재 |
| 시스템 권한 | PM + 팀원 2종만 | 세분화된 접근 제어 부재 |
| 글로벌 검색 | 없음 | 통합 검색 부재 |

---

## 1) v0.3 목표

> 프로젝트 → TASK → 스크럼 → 스케줄 핵심 축 구축

- 프로젝트 모듈 전면 리워크 (3종 유형, 뷰 전환, 진행률, 승인 프로세스)
- 독립 태스크 모듈 신설 (All/Today/Upcoming/Completed 필터 + 코멘트/첨부)
- 시스템 권한 4단계 (대표/관리자/PM/일반)
- 데일리 스크럼 3단계 플로우 (브레인스토밍 → 우선순위 → 시간 배치)
- 프로젝트 킥오프 (체크리스트 + 미팅 기록, 프로젝트 유형에서만 필수)
- 일정 (회사 캘린더)
- AI 프로젝트 리뷰 (버튼 1개로 AI 리뷰 자동화)
- 글로벌 검색 (Cmd+K 통합 검색)
- 인앱 알림 시스템
- 회의록 액션아이템 → 태스크 자동 생성 연동

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
├─ Phase A: 프로젝트 + 태스크 (기반)
│   ├─ A1. 프로젝트 리워크 (3종 유형 + 승인 + 삭제/아카이브)
│   ├─ A2. 태스크 모듈 (코멘트/첨부 + 보류 상태 + 난이도)
│   ├─ A3. 태스크 의존성 맵 (v0.3c 후반)
│   └─ A4. AI 프로젝트 리뷰 (버튼 1개 자동화)
│
├─ Phase B: 킥오프 + 일정
│   ├─ B1. 프로젝트 킥오프 (체크리스트 + 미팅 기록)
│   └─ B2. 일정 (FullCalendar, 반복일정은 v0.4)
│
├─ Phase C: 데일리 스크럼
│   └─ C1. 데일리 스크럼 3단계 플로우 + 건너뛰기
│
└─ Phase D: 통합 + QA
    ├─ D1. 시스템 권한 4단계
    ├─ D2. 대시보드 연동 (역할별 위젯)
    ├─ D3. 사이드바 (접이식 3그룹) + 글로벌 검색
    ├─ D4. 인앱 알림 시스템
    ├─ D5. 회의록 → 태스크 연동 (action_items)
    ├─ D6. 회고 → 프로젝트 연동 (포스트모템)
    └─ D7. 전체 QA + 회귀 테스트
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
| 프로젝트 유형 | 미분류 | **미니프로젝트 / 프로젝트 / 셀프 프로젝트** 3종 |
| 목록 뷰 | List만 | **List / Board / Calendar / Gantt** 4종 |
| 상세 | 개요 + 연결 데이터 탭 | **개요 + 태스크 + 타임라인 + 킥오프(프로젝트만) + 의존성 맵 + AI 리뷰 + 설정** 탭 |
| 진행률 | 없음 | **태스크 가중치 기반 자동 계산** |
| R&R | 없음 | **유형별 자유 역할 지정** (고정 템플릿 제거) |
| 완료 승인 | 없음 | **승인 버튼 + 유형별 권한자** (미니=PM, 프로젝트=PM+관리자, 셀프=본인) |
| 포스트모템 | 없음 | **프로젝트=필수, 미니=옵션, 셀프=결과보고** (기존 회고 모듈 연동) |
| 프로젝트 상태 | active/completed | **+ on_hold(보류) + archived(아카이브)** 추가 |
| 삭제 | 없음 | **PM(본인)/대표만 삭제** + 30일 소프트 삭제 |

#### DB 스키마 변경

**projects 테이블 확장**

| 컬럼 (신규) | 타입 | 설명 |
|---|---|---|
| `project_type` | enum | `mini` / `project` / `self` |
| `priority` | integer | 우선순위 (1~5) |
| `progress` | float | 진행률 (0~100, 자동 계산) |
| `color` | text | 프로젝트 대표 색상 |
| `status` | enum | `active` / `on_hold` / `completed` / `archived` |
| `on_hold_reason` | text | 보류 사유 (nullable) |
| `on_hold_resume_date` | date | 예상 재개일 (nullable) |
| `archived_at` | timestamptz | 아카이브 일시 (nullable) |
| `deleted_at` | timestamptz | 소프트 삭제 일시 (nullable, 30일 후 영구 삭제) |
| `approved_by` | uuid[] | 승인자 ID 배열 |
| `approval_status` | enum | `pending` / `approved` / `rejected` (nullable) |

**project_members 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `user_id` | uuid | FK → users |
| `role` | text | 자유 입력 (PM, 디자인, 영상, 기획 등 — 고정 enum 대신 유연한 역할 지정) |
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
/projects                           # 프로젝트 목록 (4종 뷰 전환: List/Board/Calendar/Gantt)
/projects/new                       # 프로젝트 생성 (유형 선택 + R&R 자유 배정)
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
| **List** | 테이블 형태 — 프로젝트명, 유형, 진행률, PM, 상태 | 기존 Table 컴포넌트 |
| **Board** | 상태별 컬럼 (진행중/완료/보류) | dnd-kit 드래그 |
| **Calendar** | 월간 캘린더에 프로젝트 기간 표시 | FullCalendar |
| **Gantt** | 프로젝트별 타임라인 바 차트 | FullCalendar Timeline 플러그인 |

> **변경사항**: 기존 Kanban 뷰는 태스크 메뉴(/tasks)로 이동. Node(의존성 맵) 뷰는 프로젝트 상세 내 탭으로 유지 (v0.3c).

#### 진행률 계산

```
Task 가중치: 일반(1) / 핵심(2) / 마일스톤(3)
진행률 = 완료 Task 가중치 합 / 전체 Task 가중치 합 × 100
```

#### R&R — 유형별 자유 역할 지정

> **변경**: 기존 프로젝트 종류별 고정 역할 템플릿 제거. 모든 유형에서 역할을 자유롭게 지정.

| 프로젝트 유형 | R&R 방식 | 팀 규모 |
|---|---|---|
| **미니프로젝트** | PM + 팀원 직접 지정 (간소화) | 1~3명 |
| **프로젝트** | PM + 역할 자유 배정 (디자인, 영상, 기획 등) | 3~10명 |
| **셀프 프로젝트** | 기본: 본인만. 필요시 동료 추가 | 1~2명 |

#### 프로젝트 유형별 완료 프로세스

| 유형 | 완료 승인 | 포스트모템 | 결과보고 |
|---|---|---|---|
| **미니프로젝트** | PM 단독 또는 관리자 | 선택 | — |
| **프로젝트** | PM + 관리자 합의 (둘 다 필요) | **필수** (회고 모듈 연동) | — |
| **셀프 프로젝트** | 본인 확인 (승인 불필요) | — | **필수** (팀 전체 공유) |

#### 프로젝트 유형 업그레이드

> 미니프로젝트 → 프로젝트 업그레이드만 허용. 다운그레이드 불가.
> 업그레이드 시: 킥오프 탭 활성화, 승인 권한 변경, 포스트모템 필수화.
> 기존 태스크/팀원 데이터는 유지 (소급 차단 안 함).
> **업그레이드 후 신규 태스크 생성**: 킥오프 완료가 전제조건. 킥오프 미완료 시 신규 태스크 생성 차단.
> (업그레이드 이전에 생성된 기존 태스크는 영향 없음)

> **임무카드 자동 발급**: v0.3에서 제거. 기존 R&R 고정 템플릿 기반 임무카드 → 자유 역할 지정 방식으로 대체.

---

### A2. 태스크 모듈

#### 목표
기존 회의록 액션아이템을 확장하여 **독립 태스크 관리 시스템** 구축.
액션아이템 = 태스크 개념 통합, 코멘트/첨부파일 피드백, 보류 상태, 난이도 측정 포함.

#### 현재 → 변경

| 항목 | 현재 (v0.2) | 변경 (v0.3) |
|---|---|---|
| 태스크 | 회의록 액션아이템만 존재 | **독립 태스크 모듈** + 액션아이템 자동 연결 |
| 상태 | 없음 | **pending / in_progress / review / completed / issue / on_hold** |
| 난이도 | 없음 | **쉬움 / 보통 / 어려움** (스트레스 측정용) |
| 피드백 | 없음 | **코멘트 + 파일 첨부** (리치 텍스트, @멘션) |
| 액션아이템 | 회의록 전용, 별도 관리 | **액션아이템 = 태스크** (자동 생성 + 양방향 동기화) |
| 뷰 | 없음 | **Kanban 보드** (dnd-kit) + List + 필터 탭 |

#### DB 스키마

**tasks 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects (nullable: 프로젝트 무관 태스크 허용) |
| `title` | text | 태스크명 |
| `description` | text | 상세 설명 |
| `status` | enum | `pending` / `in_progress` / `review` / `completed` / `issue` / **`on_hold`** |
| `priority` | enum | `urgent` / `high` / `normal` / `low` |
| `difficulty` | enum | **`easy` / `normal` / `hard`** — 업무 스트레스 측정용 (v0.6 퍼포먼스 연동) |
| `weight` | integer | 가중치 (1: 일반, 2: 핵심, 3: 마일스톤) |
| `assignee_id` | uuid | FK → users (담당자) |
| `created_by` | uuid | FK → users (생성자) |
| `due_date` | date | 마감일 |
| `estimated_hours` | float | 예상 소요시간 (시간 단위) |
| `actual_hours` | float | 실제 소요시간 |
| `parent_task_id` | uuid | FK → tasks (상위 태스크, 서브태스크용) |
| `milestone_id` | uuid | FK → project_milestones (nullable) |
| `source` | enum | `manual` / `meeting` / `scrum` / `kickoff` / `template` |
| `source_id` | uuid | 원본 참조 ID (회의록 ID, 스크럼 ID 등) |
| `on_hold_reason` | text | 보류 사유 (nullable) |
| `on_hold_at` | timestamptz | 보류 시점 (nullable) |
| `labels` | text[] | 라벨 태그 배열 |
| `sort_order` | integer | Kanban 내 정렬 순서 |
| `completed_at` | timestamptz | 완료 시점 |
| `created_at` | timestamptz | 생성 시점 |
| `updated_at` | timestamptz | 수정 시점 |

> **스트레스 지표 공식** (v0.6 퍼포먼스 모듈 연동):
> `업무 부하 = Σ(난이도 점수 × 예상시간 × 긴급도 가중치)`
> 난이도 점수: easy=1, normal=2, hard=3

**task_comments 테이블 (신규)** — 업무 피드백 코멘트

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `task_id` | uuid | FK → tasks |
| `user_id` | uuid | FK → users (작성자) |
| `content` | text | 리치 텍스트 내용 (@멘션 지원) |
| `mentions` | uuid[] | 멘션된 사용자 ID 배열 |
| `created_at` | timestamptz | 작성 시점 |
| `updated_at` | timestamptz | 수정 시점 |

**task_attachments 테이블 (신규)** — 업무 파일 첨부

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `task_id` | uuid | FK → tasks |
| `comment_id` | uuid | FK → task_comments (nullable: 코멘트 첨부 시) |
| `uploaded_by` | uuid | FK → users |
| `file_name` | text | 원본 파일명 |
| `file_url` | text | 저장 URL |
| `file_size` | integer | 파일 크기 (bytes) |
| `mime_type` | text | MIME 타입 |
| `created_at` | timestamptz | 업로드 시점 |

**task_dependencies 테이블 (신규)** — 의존성 맵 Edge 데이터

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `task_id` | uuid | FK → tasks (후행 태스크 = target) |
| `depends_on_id` | uuid | FK → tasks (선행 태스크 = source) |
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
/tasks                              # 전체 태스크 목록 (통합 뷰)
/tasks?filter=today                 # 오늘의 태스크
/tasks?filter=upcoming              # 다가오는 태스크
/tasks?filter=completed             # 완료된 태스크
/tasks/[id]                         # 태스크 상세
```

#### 필터 뷰

| 필터 | 조건 | 설명 |
|---|---|---|
| **All** | 전체 | 모든 태스크 (상태별 그룹) |
| **Today** | `due_date = today` 또는 `스크럼에서 오늘 배정` | 오늘 할 일 |
| **Upcoming** | `due_date > today` + `status != completed` | 다가오는 마감 |
| **Completed** | `status = completed` | 완료 아카이브 |
| **My Tasks** | `assignee_id = current_user` | 내 태스크만 |
| **On Hold** | `status = on_hold` | 보류 중인 태스크 |

#### 태스크 상태 흐름

```
pending → in_progress → review → completed
                ↓           ↓
              issue      (재작업 → in_progress)
                ↓
            on_hold ← (프로젝트 보류 시 자동 전환)
                ↓
          (재개 → in_progress)
```

> **보류 규칙**:
> - 프로젝트 보류(on_hold) 시 → 해당 프로젝트 소속 태스크 전체 자동 보류
> - 개별 태스크도 독립적으로 보류 가능 (보류 사유 필수 입력)
> - 프로젝트 재개 시 → 프로젝트 연동 보류 태스크만 자동 재개, 개별 보류는 수동

#### 액션아이템 = 태스크 통합

> **핵심 변경**: 기존 액션아이템 → 태스크 "승격" 방식에서 **자동 생성/연결** 방식으로 전환

- 회의록에서 액션아이템 작성 시 → **태스크 자동 생성** (source = `meeting`)
- 태스크 상태 변경 ↔ 액션아이템 상태 **양방향 동기화**
- 기존 `action_items` 테이블은 회의록 UI 표시용으로 유지, 실제 관리는 tasks 테이블
- 통합 뷰에서 출처(source) 필터로 구분

#### 코멘트/첨부 기능

| 기능 | 설명 |
|---|---|
| **리치 텍스트** | 마크다운 에디터 (Bold, List, Code 등) |
| **@멘션** | 팀원 멘션 → 알림 발송 |
| **파일 첨부** | 드래그앤드롭 업로드, 이미지 인라인 미리보기 |
| **코멘트 수정/삭제** | 본인 코멘트만 가능 |
| **첨부 용량** | 파일당 10MB, 태스크당 50MB 제한 |

#### 컴포넌트 설계

```
src/components/tasks/
├── task-create-dialog.tsx          # 태스크 생성 다이얼로그
├── task-detail-panel.tsx           # 태스크 상세 사이드 패널
├── task-list.tsx                   # List 뷰
├── task-board.tsx                  # Kanban 보드 뷰 (dnd-kit)
├── task-filter-tabs.tsx            # All/Today/Upcoming/Completed/On Hold 탭
├── task-priority-badge.tsx         # 우선순위 배지
├── task-difficulty-badge.tsx       # 난이도 배지 (쉬움/보통/어려움)
├── task-status-select.tsx          # 상태 변경 셀렉트 (on_hold 포함)
├── task-comments.tsx               # 코멘트 목록 + 입력
├── task-comment-editor.tsx         # 리치 텍스트 에디터 (@멘션)
├── task-attachments.tsx            # 첨부파일 목록 + 업로드
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

### A3. 태스크 의존성 맵 (Task Dependency Map) — v0.3c 후반

> ⚠️ **v0.3c(후반) 구현 예정** — A1/A2 안정화 이후 착수

#### 목표
여러 팀원이 참여하는 복잡한 프로젝트에서 **태스크 간 선후 관계와 담당자를 직관적으로 파악**할 수 있는 노드 기반 캔버스 UI

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

### A4. AI 프로젝트 리뷰 (버튼 1개 자동화)

#### 목표
기존에 수동으로 진행하던 과정(프로젝트 폼 데이터 + 태스크 리스트 → md 파일 생성 → AI에게 질문)을 **버튼 1개로 자동화**.

> **핵심 변경**: 기존 기획의 복잡한 AI 채팅 시스템 → 간소화된 "리뷰 생성" 버튼 방식.
> 대화형 질의와 정기 보고서는 추후 확장 (v0.4+).

#### 동작 플로우

```
1. PM이 프로젝트 상세 → "AI 리뷰" 탭 진입
2. "리뷰 생성" 버튼 클릭
3. 시스템이 자동으로 수행:
   a. 프로젝트 폼 데이터 수집 (목표, 범위, 팀, 마일스톤)
   b. 소속 태스크 리스트 수집 (상태, 담당자, 마감일, 난이도)
   c. 킥오프 데이터 (있으면)
   d. 수집 데이터 → 구조화된 md 텍스트 자동 생성
   e. Gemini AI에게 리뷰 요청
   f. AI 응답을 리뷰 결과로 저장 + 화면 표시
4. 리뷰 이력 목록에서 과거 리뷰 열람 가능
```

#### 기술 스택

| 항목 | 내용 |
|---|---|
| **AI 모델** | Google Gemini (기존 클라이언트 예측에서 사용 중) |
| **API** | Gemini 2.0 Flash |
| **데이터 소스** | projects, tasks, project_members, project_kickoffs, project_milestones |

#### AI 프롬프트에 주입할 데이터 (자동 md 생성)

| 데이터 | 소스 | 내용 |
|---|---|---|
| **프로젝트 개요** | projects | 이름, 유형, 상태, 시작/종료일, 목표 |
| **팀 구성** | project_members | 역할별 담당자 |
| **태스크 현황** | tasks | 전체 목록 (상태, 담당자, 마감일, 난이도, 가중치) |
| **마일스톤** | project_milestones | 목표일 대비 진척 |
| **킥오프** | project_kickoffs | 목표, 범위, 제약조건 (있으면) |

#### AI에게 요청하는 리뷰 항목

| 항목 | 설명 |
|---|---|
| **진행 상황 요약** | 진행률, 완료/진행/대기 태스크 수 |
| **위험 요소 식별** | 지연 태스크, 마감 임박, 담당자 과부하 |
| **추천 사항** | 일정 조정, 우선순위 변경, 인력 재배정 제안 |
| **전체 평가** | 프로젝트 건강도 (양호/주의/위험) |

#### DB 스키마

**project_reviews 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects |
| `review_type` | enum | `on_demand` (v0.3에서는 이것만) |
| `generated_by` | text | AI 모델명 (gemini-2.0-flash) |
| `input_markdown` | text | AI에게 보낸 md 원문 (디버깅/재현용) |
| `summary` | text | AI 요약 (1~2줄) |
| `report_content` | jsonb | 구조화된 리뷰 결과 |
| `risk_level` | enum | `low` / `medium` / `high` / `critical` |
| `recommendations` | jsonb | AI 추천 사항 배열 |
| `created_by` | uuid | FK → users (요청자) |
| `created_at` | timestamptz | 생성 시점 |

#### 페이지 구성

```
/projects/[id]/review               # AI 리뷰 탭 (리뷰 목록 + 생성 버튼)
/projects/[id]/review/[reviewId]    # 리뷰 상세 보기
```

#### 컴포넌트 설계

```
src/components/project-review/
├── review-generate-button.tsx      # "리뷰 생성" 버튼 + 로딩 상태
├── review-result-card.tsx          # 리뷰 결과 카드
├── review-history-list.tsx         # 과거 리뷰 이력 목록
├── review-risk-badge.tsx           # 위험도 배지 (low/medium/high/critical)
└── review-recommendations.tsx      # AI 추천 사항 표시
```

---

#### 페이지 구성 (전체 — 프로젝트 상세 탭)

```
/projects/[id]/dependency-map       # 프로젝트별 의존성 맵 (메인)
```

프로젝트 상세 허브의 탭으로도 접근 가능 (개요 / 태스크 / **의존성 맵** / 타임라인 / 킥오프 / **AI 리뷰** / 설정)

---

## 5) Phase B: 킥오프 + 스케줄

### B1. 프로젝트 킥오프

#### 목표
프로젝트 시작 시 **팀원/일정/목표/체크리스트**를 체계적으로 설정하는 킥오프 시스템.
**체크리스트 + 미팅 기록** 이중 역할을 수행하며, **킥오프 완료 = 태스크 생성 전제조건**.

> **적용 범위**: "프로젝트" 유형에서만 필수. 미니프로젝트/셀프 프로젝트는 킥오프 없음.

#### 현재 → 변경

| 항목 | 기존 (v0.3 plan) | 변경 |
|---|---|---|
| 킥오프 역할 | 체크리스트만 | **체크리스트 + 미팅 기록** 이중 역할 |
| 태스크 생성 | 언제든 가능 | **킥오프 완료 후에만 태스크 생성 가능** (프로젝트 유형) |
| 기본 체크리스트 | 4종(일반/이벤트/콘텐츠/운영) | **프로젝트 유형 1종** (자유 추가) |
| 미팅 기록 | 없음 | **킥오프 미팅 노트** (참석자, 결정사항, 액션아이템) |

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
| `meeting_notes` | text | 킥오프 미팅 기록 (리치 텍스트) |
| `meeting_attendees` | uuid[] | 미팅 참석자 ID 배열 |
| `meeting_decisions` | jsonb | 주요 결정사항 [{title, content}] |
| `status` | enum | `draft` / `in_progress` / `completed` |
| `completed_at` | timestamptz | 킥오프 완료 시점 |
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

#### 킥오프 완료 → 태스크 생성 전제조건

```
프로젝트 생성 → 킥오프 탭 활성화 (status: draft)
   → 체크리스트 작성 + 미팅 기록
   → 킥오프 완료 (status: completed)
   → 태스크 탭 활성화 (태스크 생성 가능)

※ 킥오프 미완료 상태에서 태스크 생성 시도 →
   "킥오프를 먼저 완료해주세요" 안내 + 킥오프 탭 이동 유도
```

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
| **체크리스트** | 시작 전 확인 항목 (담당자별 체크) + 자유 추가 가능 |
| **미팅 기록** | 킥오프 미팅 참석자, 결정사항, 노트 |
| **킥오프 완료** | 모든 체크리스트 완료 시 "킥오프 완료" 버튼 활성화 |

#### 기본 체크리스트 (프로젝트 유형 공통)

> 기존 4종(일반/이벤트/콘텐츠/운영) 분류 제거 → 프로젝트 유형이 3종(미니/프로젝트/셀프)으로 변경됨에 따라 **공통 체크리스트 1종** + 자유 추가

| 기본 항목 |
|---|
| 프로젝트 목표 확정 |
| 일정표 공유 |
| R&R 확인 (팀원 전원 역할 숙지) |
| 커뮤니케이션 채널 설정 |
| 마일스톤 합의 |
| + PM이 자유롭게 항목 추가 가능 |

#### 컴포넌트 설계

```
src/components/kickoff/
├── kickoff-overview.tsx            # 프로젝트 개요 섹션
├── kickoff-team.tsx                # 팀 구성 + R&R
├── kickoff-milestones.tsx          # 마일스톤 타임라인
├── kickoff-checklist.tsx           # 체크리스트 (드래그 정렬 + 자유 추가)
├── kickoff-meeting-notes.tsx       # 미팅 기록 (참석자 + 결정사항 + 노트)
├── kickoff-progress.tsx            # 킥오프 완료율 표시
└── kickoff-complete-button.tsx     # 킥오프 완료 버튼 (전제조건 검증)
```

---

### B2. 일정 (구 GRIFF 스케줄)

> **변경**: "GRIFF 스케줄" → **"일정"** 으로 메뉴명 간소화

#### 목표
회사 주요 일정을 관리하는 **캘린더 시스템**

#### 수정 권한

| 권한 | 일정 생성 | 본인 일정 수정 | 전체 일정 수정 |
|---|---|---|---|
| **대표/관리자** | O | O | **O** |
| **PM** | O | O | X |
| **일반** | O | O | X |

> 모든 사용자가 일정 **열람**은 가능. 생성도 가능. 수정/삭제는 본인 것만 (대표/관리자 제외).

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
| `color` | text | 캘린더 표시 색상 |
| `created_by` | uuid | FK → users |
| `is_public` | boolean | 전사 공개 여부 |
| `target_user_id` | uuid | FK → users (nullable: 개인 일정일 때) |
| `created_at` | timestamptz | 생성 시점 |

> **반복 일정(recurrence)**: v0.4로 이동. v0.3에서는 단일 일정만 지원.

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
| `status` | enum | `not_started` / `brainstorming` / `prioritizing` / `scheduling` / `completed` / **`skipped`** |
| `skip_reason` | text | 건너뛰기 사유 (nullable) |
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

#### 건너뛰기 기능

> 외근, 휴가, 미팅 밀집일 등 스크럼이 불필요한 날에 사용

| 기능 | 설명 |
|---|---|
| **건너뛰기 버튼** | 스크럼 시작 화면에서 "오늘 건너뛰기" 버튼 |
| **사유 선택** | 외근 / 휴가 / 회의 밀집 / 기타 (자유 입력) |
| **기록 저장** | `status = skipped`, 사유 저장 |
| **이월 처리** | 어제 미완료 태스크는 다음 날 자동 이월 |
| **대시보드** | 건너뛴 날도 표시 (회색 처리) |

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

### D1. 시스템 권한 4단계

> **변경**: 기존 PM + 팀원 2종 → **대표/관리자/PM/일반** 4단계

#### 권한 매트릭스

| 권한 | 대시보드 | 스크럼 | 태스크 | 프로젝트 | 일정 |
|---|---|---|---|---|---|
| **대표** | 전사 현황 열람 | 본인 작성 + 전체 열람 | 전체 열람(읽기) + 본인 관리 | 생성/열람/승인 | 전사 열람+생성+전체 수정 |
| **관리자** | 전사 현황 열람 | 본인 작성 + 전체 열람 | 전체 열람(읽기) + 본인 관리 | 생성/열람/승인 | 전사 열람+생성+전체 수정 |
| **PM** | 담당 프로젝트 현황 | 본인 작성 + 팀원 열람 | 본인+담당 프로젝트 팀원 관리 | 생성/열람/승인(담당) | 전사 열람+생성 |
| **일반** | 본인 현황 | 본인 작성만 | 본인 관리+직접 생성 | 생성/열람(배정된 것) | 전사 열람+생성 |

#### 프로젝트 삭제 권한

| 행위 | 가능자 | 조건 |
|---|---|---|
| **삭제** | PM (본인 생성분) / 대표 | 30일 소프트 삭제 → 영구 삭제 |
| **아카이브** | 시스템 자동 | 완료 30일 후 아카이브 제안, 읽기 전용 |

### D2. 대시보드 연동

현재 대시보드에 v0.3 모듈 위젯 추가 (역할별 위젯 구성은 추후 결정):

| 위젯 | 내용 |
|---|---|
| **스크럼 상태** | 오늘 스크럼 완료/미완료/건너뜀 표시 + 바로가기 |
| **오늘의 태스크** | 오늘 마감 태스크 목록 (최대 5건) |
| **프로젝트 진행률** | 활성 프로젝트 진행률 바 |
| **오늘 일정** | 일정에서 오늘 일정 요약 |

### D3. 사이드바 (접이식 3그룹) + 글로벌 검색

> **변경**: 기존 평면 나열 11개 → **접이식 3그룹** (핵심/지원/설정)

```typescript
// constants.ts 변경 계획
SIDEBAR_GROUPS = [
  {
    label: "핵심",
    items: [
      { title: "대시보드", url: "/dashboard", icon: LayoutDashboard },
      { title: "데일리 스크럼", url: "/scrum", icon: Sunrise },
      { title: "태스크", url: "/tasks", icon: CheckSquare },
      { title: "프로젝트", url: "/projects", icon: FolderKanban },
      { title: "일정", url: "/schedule", icon: CalendarDays },
    ]
  },
  {
    label: "지원",
    items: [
      { title: "회고", url: "/retrospective", icon: MessageSquareText },
      { title: "회의록", url: "/meetings", icon: FileText },
      { title: "입금/결제", url: "/payments", icon: CreditCard },
      { title: "견적서", url: "/estimates", icon: Calculator },
      { title: "클라이언트 예측", url: "/predict", icon: Brain },
    ]
  },
  {
    label: "설정",
    items: [
      { title: "설정", url: "/settings", icon: Settings },
    ]
  }
];
```

#### 글로벌 검색 (Cmd+K / Ctrl+K)

| 항목 | 내용 |
|---|---|
| **단축키** | `Cmd+K` (Mac) / `Ctrl+K` (Windows) |
| **검색 범위** | 프로젝트, 태스크, 회의록, 일정, 팀원 (권한별 필터) |
| **UI** | 중앙 커맨드 팔레트 (다이얼로그) |
| **기능** | 실시간 검색 + 최근 검색 기록 + 바로가기 |
| **권한** | 본인 접근 가능한 항목만 검색 결과에 노출 |

### D4. 인앱 알림 시스템

> v0.3에서는 **인앱 알림만**. v0.4에서 **슬랙 연동** 예정.

| 알림 유형 | 트리거 | 수신자 |
|---|---|---|
| **태스크 배정** | 태스크 assignee 변경 | 담당자 |
| **태스크 상태 변경** | 상태 전환 (특히 완료/이슈) | PM + 관련자 |
| **마감 임박** | D-2 이내 + 미완료 | 담당자 |
| **코멘트 멘션** | @멘션 | 멘션된 사용자 |
| **프로젝트 상태 변경** | 보류/완료/삭제 | 프로젝트 멤버 전원 |
| **킥오프 완료** | 킥오프 status → completed | 프로젝트 멤버 전원 |
| **스크럼 리마인드** | 오전 미시작 | 해당 사용자 |
| **의존성 블로커** | 선행 태스크 이슈 | 후행 담당자 + PM |

### D5. 회의록 → 태스크 연동 (action_items = 태스크)

> **핵심**: 회의록 액션아이템 작성 시 태스크 자동 생성, 상태 양방향 동기화

| 동작 | 설명 |
|---|---|
| **액션아이템 작성** | 회의록에서 액션아이템 입력 → tasks 테이블에 자동 INSERT (source = `meeting`) |
| **태스크 → 액션아이템** | 태스크 상태 변경 → 회의록 내 액션아이템 상태도 자동 업데이트 |
| **액션아이템 → 태스크** | 회의록 내 액션아이템 체크 → 연결된 태스크 상태도 자동 업데이트 |
| **링크** | 태스크 상세에서 "출처: 회의록 #123" 링크 표시 |

### D6. 회고 → 프로젝트 연동 (포스트모템)

> 기존 회고 모듈과 프로젝트 완료 프로세스 연동

| 프로젝트 유형 | 포스트모템 | 연동 방식 |
|---|---|---|
| **프로젝트** | 필수 | 프로젝트 완료 승인 후 → 회고 작성 자동 유도 |
| **미니프로젝트** | 선택 | 완료 시 "회고 작성하시겠습니까?" 제안 |
| **셀프 프로젝트** | 없음 | 결과보고로 대체 |

### D7. 전체 QA + 회귀 테스트

> v0.25 테스트 루틴 동일 적용 — 문제 0건까지 반복

---

## 8) 우선순위 매트릭스

### Phase A — 기반 (필수, 먼저)

| 작업 | 난이도 | 예상 |
|---|---|---|
| A1-1. projects 테이블 확장 (유형/상태/삭제/아카이브) + project_members/milestones | 중간 | 4h |
| A1-2. 프로젝트 메뉴 활성화 + 하위 메뉴 | 낮음 | 1h |
| A1-3. 프로젝트 목록 4종 뷰 전환 (List/Board/Calendar/Gantt) | 높음 | 10h |
| A1-4. 프로젝트 생성 리워크 (3종 유형 선택 + 자유 R&R) | 중간 | 6h |
| A1-5. 프로젝트 상세 허브 탭 재구성 | 중간 | 4h |
| A1-6. 진행률 자동 계산 | 중간 | 3h |
| A1-7. 프로젝트 승인 프로세스 (유형별 승인자) | 중간 | 4h |
| A1-8. 프로젝트 삭제/아카이브 + 유형 업그레이드 | 중간 | 3h |
| A2-1. tasks 테이블 (난이도/보류/코멘트/첨부) + task_dependencies | 중간 | 4h |
| A2-2. 태스크 CRUD + 상태 관리 (on_hold 포함) | 중간 | 6h |
| A2-3. 태스크 필터 탭 (All/Today/Upcoming/Completed/My/On Hold) | 중간 | 4h |
| A2-4. 태스크 Kanban 보드 (dnd-kit) | 높음 | 8h |
| A2-5. 태스크 상세 사이드 패널 + 코멘트/첨부 | 중간 | 6h |
| A2-6. 서브태스크 | 중간 | 3h |
| A2-7. 액션아이템 → 태스크 자동 연결 (양방향 동기화) | 중간 | 4h |
| A3-1. React Flow 캔버스 + 커스텀 노드/엣지 **(v0.3c)** | 높음 | 10h |
| A3-2. DAG 순환 참조 검증 로직 **(v0.3c)** | 중간 | 3h |
| A3-3. 자동 정렬 (dagre 레이아웃) **(v0.3c)** | 중간 | 4h |
| A3-4. 상태 전파 시각화 **(v0.3c)** | 중간 | 4h |
| A3-5. 필터/하이라이트 **(v0.3c)** | 중간 | 4h |
| A3-6. 진행 현황 대시보드 **(v0.3c)** | 중간 | 6h |
| A4-1. AI 리뷰 — md 자동 생성 + Gemini 호출 (버튼 1개) | 중간 | 6h |
| A4-2. AI 리뷰 — 리뷰 결과 표시 + 이력 관리 | 중간 | 4h |

### Phase B — 보조 시스템

| 작업 | 난이도 | 예상 |
|---|---|---|
| B1-1. project_kickoffs + checklist 테이블 (미팅 기록 포함) | 낮음 | 2h |
| B1-2. 킥오프 페이지 UI (개요/팀/마일스톤/체크리스트/미팅 기록) | 중간 | 8h |
| B1-3. 킥오프 완료 → 태스크 생성 전제조건 로직 | 중간 | 3h |
| B2-1. schedules 테이블 (반복 일정 제외) | 낮음 | 2h |
| B2-2. FullCalendar 연동 (월/주/일 뷰) | 높음 | 10h |
| B2-3. 일정 생성/수정 다이얼로그 + 수정 권한 | 중간 | 4h |
| B2-4. 카테고리 필터 + 색상 시스템 | 낮음 | 2h |

### Phase C — 데일리 스크럼

| 작업 | 난이도 | 예상 |
|---|---|---|
| C1-1. daily_scrums (skipped 상태 포함) + scrum_items 테이블 | 중간 | 3h |
| C1-2. 3단계 스텝 UI 프레임 + 건너뛰기 기능 | 중간 | 5h |
| C1-3. A단계: AI 대화 + 자동 이월 + 자유 입력 | 높음 | 12h |
| C1-4. B단계: 드래그 정렬 + 아이젠하워 매트릭스 | 높음 | 8h |
| C1-5. C단계: 타임블록 배치 + 캘린더 연동 | 높음 | 10h |
| C1-6. 완료 시 태스크 자동 등록 | 중간 | 4h |
| C1-7. 하루 마감 회고 | 낮음 | 3h |

### Phase D — 통합

| 작업 | 난이도 | 예상 |
|---|---|---|
| D1. 시스템 권한 4단계 (대표/관리자/PM/일반) | 중간 | 6h |
| D2. 대시보드 위젯 추가 | 중간 | 6h |
| D3. 사이드바 접이식 3그룹 + 글로벌 검색 (Cmd+K) | 중간 | 6h |
| D4. 인앱 알림 시스템 | 중간 | 8h |
| D5. 회의록 → 태스크 연동 (action_items 양방향 동기화) | 중간 | 4h |
| D6. 회고 → 프로젝트 연동 (포스트모템) | 낮음 | 2h |
| D7. 전체 QA (4조합 테스트 + 회귀) | 중간 | 8h |

---

## 9) 개발 일정

```
Phase A: 프로젝트 + 태스크 (기반)
  │
  ├─ A1. 프로젝트 리워크
  │   ├─ DB 스키마 (3종 유형 + 상태 + 삭제/아카이브)
  │   ├─ 메뉴 활성화 + 목록 4종 뷰 전환
  │   ├─ 생성 리워크 (유형 선택 + 자유 R&R)
  │   ├─ 상세 허브 + 진행률 + 승인 프로세스
  │   └─ 유형 업그레이드 (미니→프로젝트)
  │
  ├─ A2. 태스크 모듈
  │   ├─ DB 스키마 (난이도/보류/코멘트/첨부)
  │   ├─ CRUD + 상태 관리 (on_hold 포함)
  │   ├─ 필터 탭 + Kanban 보드 (dnd-kit)
  │   ├─ 상세 패널 + 코멘트/첨부 + 서브태스크
  │   └─ 액션아이템 → 태스크 자동 연결
  │
  ├─ A4. AI 프로젝트 리뷰 (버튼 1개 자동화)
  │   ├─ md 자동 생성 + Gemini 호출
  │   └─ 리뷰 결과 표시 + 이력 관리
  │
  └─ A3. 태스크 의존성 맵 (v0.3c 후반)
      ├─ React Flow 캔버스 + 커스텀 노드/엣지
      ├─ DAG 순환 참조 검증 + 자동 정렬
      ├─ 상태 전파 시각화 + 필터/하이라이트
      └─ 진행 현황 대시보드
  │
  ▼
Phase B: 킥오프 + 일정
  │
  ├─ B1. 킥오프 (체크리스트 + 미팅 기록 + 태스크 생성 전제조건)
  └─ B2. 일정 (FullCalendar, 반복일정은 v0.4)
  │
  ▼
Phase C: 데일리 스크럼
  │
  ├─ C1. 3단계 플로우 UI + 건너뛰기
  ├─ AI 대화 + 이월 + 정렬
  ├─ 타임블록 배치
  └─ 태스크 자동 등록
  │
  ▼
Phase D: 통합 + QA
  │
  ├─ D1. 시스템 권한 4단계
  ├─ D2. 대시보드 위젯
  ├─ D3. 사이드바 3그룹 + 글로벌 검색
  ├─ D4. 인앱 알림 시스템
  ├─ D5. 회의록 → 태스크 연동
  ├─ D6. 회고 → 프로젝트 연동
  └─ D7. 전체 QA (문제 0건까지 반복)
```

### Git 운영

- 브랜치: `feature/v0.3-core-engine`
- 커밋 컨벤션: `feat:` 접두사 (예: `feat: Task 모듈 CRUD 구현`)
- Phase 단위 QA → 머지 → 다음 Phase

---

## 10) 영향받는 기존 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/constants.ts` | 사이드바 3그룹 구조 변경 (태스크/일정 신규, TASK→태스크, 스케줄→일정) |
| `src/components/layout/app-sidebar.tsx` | 접이식 그룹 렌더링 + 새 메뉴 아이콘 + 글로벌 검색 단축키 |
| `src/components/layout/breadcrumb-nav.tsx` | 새 경로 라벨 매핑 추가 |
| `src/app/(dashboard)/dashboard/page.tsx` | 새 위젯 추가 (스크럼/태스크/프로젝트/일정) |
| `src/app/(dashboard)/projects/*` | 프로젝트 전면 리워크 (3종 유형, 승인, 삭제/아카이브) |
| `src/components/projects/*` | 프로젝트 컴포넌트 전면 리워크 |
| `src/app/(dashboard)/meetings/action-items/page.tsx` | 액션아이템 → 태스크 자동 연결 로직 |
| `src/app/(dashboard)/retrospective/*` | 프로젝트 포스트모템 연동 |
| `src/lib/middleware.ts` (또는 auth 관련) | 시스템 권한 4단계 접근 제어 |

---

## 11) 신규 파일 예상

### 페이지 (약 17개)

```
src/app/(dashboard)/tasks/page.tsx
src/app/(dashboard)/tasks/[id]/page.tsx
src/app/(dashboard)/tasks/loading.tsx
src/app/(dashboard)/tasks/error.tsx
src/app/(dashboard)/projects/new/page.tsx
src/app/(dashboard)/projects/[id]/tasks/page.tsx
src/app/(dashboard)/projects/[id]/dependency-map/page.tsx
src/app/(dashboard)/projects/[id]/review/page.tsx
src/app/(dashboard)/projects/[id]/review/[reviewId]/page.tsx
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

### 컴포넌트 (약 45개)

```
src/components/tasks/ (13개 + dependency-map/ 6개)
  ├── task-create-dialog, task-detail-panel, task-list, task-board
  ├── task-filter-tabs, task-priority-badge, task-difficulty-badge
  ├── task-status-select, task-comments, task-comment-editor
  ├── task-attachments, subtask-list
  └── dependency-map/ (6개)

src/components/project-review/ (5개)
  └── review-generate-button, review-result-card, review-history-list,
      review-risk-badge, review-recommendations

src/components/kickoff/ (7개)
  └── kickoff-overview, kickoff-team, kickoff-milestones, kickoff-checklist,
      kickoff-meeting-notes, kickoff-progress, kickoff-complete-button

src/components/schedule/ (5개)
  └── schedule-calendar, schedule-event-dialog, schedule-sidebar,
      schedule-event-card, schedule-view-toggle

src/components/scrum/ (10개)
  └── scrum-stepper, scrum-brainstorm, scrum-ai-chat, scrum-prioritize,
      scrum-eisenhower, scrum-schedule, scrum-timeline, scrum-summary,
      scrum-review, scrum-carry-over

src/components/common/ (2개 — 신규)
  └── global-search-dialog, notification-popover

src/components/dashboard/ (4개 — 신규 위젯)
```

### 유틸/타입 (약 7개)

```
src/types/task.types.ts
src/types/scrum.types.ts
src/types/schedule.types.ts
src/types/notification.types.ts
src/lib/task-utils.ts
src/lib/scrum-utils.ts
src/lib/permission-utils.ts         # 시스템 권한 4단계 헬퍼
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

#### Phase A: 프로젝트 + 태스크

| 시나리오 | 검증 항목 |
|---|---|
| 프로젝트 생성 (3종 유형) | 유형별 R&R 자유 지정, 승인 프로세스 |
| 프로젝트 4종 뷰 전환 | List/Board/Calendar/Gantt 정상 렌더링 |
| 프로젝트 삭제/아카이브 | PM/대표 삭제, 30일 소프트 삭제, 아카이브 전환 |
| 태스크 CRUD | 생성/조회/수정/삭제/상태변경 (on_hold 포함) |
| 태스크 난이도 | easy/normal/hard 선택 + 스트레스 지표 계산 |
| 태스크 코멘트/첨부 | 리치 텍스트, @멘션, 파일 업로드 |
| 태스크 Kanban 드래그 | 상태 컬럼 간 드래그 이동 + DB 반영 |
| 태스크 필터 탭 전환 | All/Today/Upcoming/Completed/My/On Hold 데이터 정확성 |
| 진행률 계산 | 태스크 완료 시 프로젝트 진행률 자동 업데이트 |
| 액션아이템 연동 | 회의록 액션아이템 → 태스크 자동 생성 + 양방향 동기화 |
| AI 리뷰 | 버튼 1개로 md 생성 → Gemini 호출 → 결과 표시 |
| 의존성 맵 캔버스 (v0.3c) | React Flow 렌더링, 줌/패닝/미니맵 정상 동작 |
| 노드 연결 (v0.3c) | 드래그로 Edge 생성, 순환 참조 시 에러 메시지 차단 |
| 자동 정렬 (v0.3c) | dagre 레이아웃 적용 시 겹침 없이 배치 |
| 상태 전파 (v0.3c) | 선행 태스크 완료/지연/이슈 시 후행 노드 시각 변경 |
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

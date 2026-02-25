# GRIFF-Q 0.1 사이트맵 & 상세 기획

## 사이트맵

```
/
├── /login                          # 로그인
├── /dashboard                      # 대시보드 (로그인 후 랜딩)
│
├── /retrospective                  # 회고 시스템
│   ├── /retrospective/new          # 개인 회고 작성
│   ├── /retrospective/[id]         # 개인 회고 상세/수정
│   └── /retrospective/summary/[projectId]  # 프로젝트별 취합 뷰
│
├── /meetings                       # 회의록 관리
│   ├── /meetings/new               # 회의록 작성
│   ├── /meetings/[id]              # 회의록 상세/수정
│   └── /meetings/import            # Google Sheets 복붙 파싱 입력
│
├── /payments                       # 입금/결제 요청
│   ├── /payments/new               # 요청 등록
│   └── /payments/[id]              # 요청 상세/수정
│
├── /estimates                      # 견적서 공동 작업
│   ├── /estimates/new              # 견적서 생성
│   ├── /estimates/[id]             # 견적서 편집 (순차 편집 + 잠금)
│   └── /estimates/[id]/compare     # 작년 견적 비교
│
├── /predict                        # 클라이언트 반응 예측
│   ├── /predict/avatars            # 아바타 목록 (카드 그리드)
│   ├── /predict/avatars/new        # 아바타 생성 (수동 프리셋)
│   ├── /predict/avatars/[id]/settings  # 인격 설정 (수동 프로필)
│   └── /predict/chat/[avatarId]    # 아바타와 예측 채팅
│
└── /settings                       # 설정 (super/boss만 접근)
    ├── /settings/users             # 계정/권한 관리
    └── /settings/logs              # 변경 이력 조회/롤백
```

---

## 권한별 접근 매트릭스

| 페이지 | super | boss | manager | normal |
|---|:---:|:---:|:---:|:---:|
| 대시보드 | ✅ | ✅ | ✅ | ✅ |
| 회고 - 개인 작성 | ✅ | ✅ | ✅ | ✅ |
| 회고 - 취합 뷰 | ✅ | ✅ | ✅ | 읽기만 |
| 회의록 | ✅ | ✅ | ✅ | 읽기만 |
| 입금/결제 요청 | ✅ | ✅ | ✅ | 읽기만 |
| 견적서 | ✅ | ✅ | ✅ | 읽기만 |
| 클라이언트 예측 | ✅ | ✅ | ✅ | ❌ |
| 설정 - 계정 관리 | ✅ | ✅ | ❌ | ❌ |
| 설정 - 변경 이력 조회 | ✅ | ✅ | 읽기만 | ❌ |

---

## 페이지별 상세 기획

### 1. 로그인 `/login`

**기능**
- 이메일 + 비밀번호 입력
- Supabase Auth 연동
- 로그인 실패 시 에러 메시지
- 세션 만료 시 자동 리다이렉트

**shadcn/ui 컴포넌트**
- Card, Input, Button, Label

---

### 2. 대시보드 `/dashboard`

**기능**
- 다가오는 마감일 위젯 (회의록 액션아이템 + 입금 마감일)
- 최근 입금/결제 요청 건수 위젯
- 최근 변경 로그 타임라인 (최신 10건)
- 진행 중인 견적서 목록
- 회고 제출 현황 (프로젝트별)

**shadcn/ui 컴포넌트**
- Card, Table, Badge, ScrollArea

---

### 3. 회고 시스템 `/retrospective`

#### 3-1. 개인 회고 작성 `/retrospective/new`

**입력 필드**
- 프로젝트명 (Select — 기존 프로젝트 목록 또는 직접 입력)
- 회고 기간 (DateRangePicker)
- 작성자 이름 (자동 채움 — 로그인 사용자)
- 역할 (복수 선택 Checkbox): 디자인, 인쇄, 웹사이트 제작, 브랜딩, 촬영, 중계, 라이브 중계, 사진촬영, 진행, 홍보, PR
- KPT 섹션: Keep / Problem / Try (각 Textarea, 항목 추가 가능)
- SSC 섹션: Start / Stop / Continue (각 Textarea, 항목 추가 가능)
- 공유 메모 (선택): 팀 공유 포인트 / 다음 반영 사항

**동작**
- 임시 저장 (Draft) 지원
- 제출 후 수정 불가 (super/boss만 수정 허용)

**shadcn/ui 컴포넌트**
- Form, Input, Textarea, Checkbox, Select, DatePicker, Button, Card

#### 3-2. 취합 뷰 `/retrospective/summary/[projectId]`

**기능**
- 프로젝트 선택 → 해당 프로젝트 회고 전체 조회
- 역할별 참여 현황 테이블 (이름 / 역할 / 제출 여부)
- 통합 인사이트: Keep+Continue / Problem+Stop / Try+Start 자동 묶기
- 역할별 핵심 요약 테이블
- 최종 합의 사항 편집 영역 (manager 이상)

**shadcn/ui 컴포넌트**
- Table, Tabs, Card, Badge, Textarea

---

### 4. 회의록 관리 `/meetings`

#### 4-1. 회의록 목록 `/meetings`

**기능**
- 회의록 테이블 뷰 (날짜, 제목, 참석자, 액션아이템 수, 완료율)
- 검색 + 날짜 범위 필터
- 정렬: 날짜순 / 미완료 액션아이템 우선

#### 4-2. 회의록 작성/수정 `/meetings/new`, `/meetings/[id]`

**입력 필드**
- 회의 제목
- 회의 날짜 (DatePicker)
- 참석자 (MultiSelect — 팀원 목록)
- 회의 내용 (Textarea 또는 간단한 리치 텍스트)
- 액션아이템 테이블 (인라인 편집)
  - 항목명
  - 담당자 (Select)
  - 마감일 (DatePicker)
  - 상태 (대기 / 진행중 / 완료)
  - 비고

**동작**
- 액션아이템 행 추가/삭제
- 상태 변경 시 변경 이력 자동 기록
- Google Sheets 퍼블리시 버튼

#### 4-3. Google Sheets 파싱 입력 `/meetings/import`

**기능**
- 텍스트 영역에 Google Sheets 내용 붙여넣기
- 탭/줄바꿈 기반 자동 파싱
- 파싱 결과 미리보기 테이블
- 확인 후 회의록으로 저장

**shadcn/ui 컴포넌트**
- DataTable, Input, Select, DatePicker, Textarea, Button, Dialog, Badge

---

### 5. 입금/결제 요청 `/payments`

#### 5-1. 요청 목록 `/payments`

**기능**
- 은행명 기준 그룹핑 리스트 (기본 뷰)
- 전체 리스트 뷰 (테이블)
- 뷰 전환 토글
- 상태 필터: 전체 / 대기 / 완료
- 마감일 임박순 정렬

#### 5-2. 요청 등록/수정 `/payments/new`, `/payments/[id]`

**입력 필드**
- 이름 (Input)
- 금액 (Input — 숫자, 천단위 콤마 자동)
- 은행 (Select — 주요 은행 프리셋)
- 계좌번호 (Input)
- 입금자명 (Input)
- 마감일 (DatePicker)
- 비고 (Textarea)

**동작**
- 등록 후 목록에 즉시 반영
- 완료 처리 버튼 (입금 확인)

**shadcn/ui 컴포넌트**
- Form, Input, Select, DatePicker, Textarea, Button, DataTable, Card, Badge

---

### 6. 견적서 공동 작업 `/estimates`

#### 6-1. 견적서 목록 `/estimates`

**기능**
- 프로젝트별 견적서 목록
- 상태: 작성중 / 확정 / 발송완료
- 현재 편집 중인 사용자 표시 (잠금 상태 배지)

#### 6-2. 견적서 편집 `/estimates/[id]`

**기능**
- 기본 정보: 프로젝트명, 클라이언트명, 견적일, 유효기간
- 항목 테이블 (순차 편집 + 잠금 방식)
  - 항목명
  - 수량
  - 단가
  - 금액 (자동 계산)
  - 비고
- 소계 / 부가세 / 총액 자동 계산
- 하이라이트: 셀 단위 배경색 지정 (변경/주의 항목 강조)
- 편집 잠금: 편집 시작 시 다른 사용자에게 "편집 중" 표시, 잠금 자동 해제 (타임아웃 5분)
- 퍼블리시: PDF (`@react-pdf/renderer`) / Google Sheets (Service Account API) / Excel (`exceljs`) 다운로드

> **v0.2 예정**: Supabase Realtime+Presence 기반 실시간 동시 편집, 접속자 커서 표시

#### 6-3. 작년 견적 비교 `/estimates/[id]/compare`

**기능**
- 좌우 분할 비교 뷰 (현재 vs 작년)
- 항목별 금액 차이 자동 표시 (증가/감소 색상)
- 새로 추가/삭제된 항목 하이라이트

**shadcn/ui 컴포넌트**
- DataTable, Input, Select, DatePicker, Button, Avatar, Tooltip, DropdownMenu, Sheet

---

### 7. 클라이언트 반응 예측 `/predict` (v0.1 MVP)

> 클라이언트별 수동 프리셋 아바타를 생성하고, Gemini API를 통해 예상 반응을 시뮬레이션하는 시스템

#### 7-1. 아바타 목록 `/predict/avatars`

**기능**
- 생성된 아바타 카드 그리드 (아바타 이미지, 이름, 소속)
- 아바타 생성 / 삭제
- 클라이언트 1명당 여러 아바타 생성 가능 (예: 김과장-공식, 김과장-비공식)

#### 7-2. 아바타 생성 & 인격 설정 `/predict/avatars/new`, `/predict/avatars/[id]/settings`

**기본 정보**
- 아바타 이름 (예: 김과장, 이대리)
- 소속/회사명
- 직급/역할
- 아바타 이미지 (기본 제공 아이콘 선택)

**수동 인격 프로필 설정**
- 말투 스타일 (Select: 격식체/비격식체, 직설적/완곡, 간결/장문)
- 성격 키워드 (태그 입력: 예: 꼼꼼함, 가격 민감, 빠른 의사결정)
- 의사결정 패턴 (Select: 즉답형 / 검토 후 답변형 / 상사 확인형)
- 민감 주제 (태그 입력: 예: 예산, 일정 지연)
- 추가 메모 (Textarea: 자유 형식으로 이 사람의 특징 기술)

#### 7-3. 예측 채팅 `/predict/chat/[avatarId]`

**기능**
- 채팅 UI
  - 왼쪽: 사용자 입력 (우리 측 발언)
  - 오른쪽: 아바타 예측 응답 (Gemini API)
  - 아바타 이미지 + 이름 표시
- 시스템 프롬프트에 수동 설정한 인격 프로필 자동 주입
- 대화 이력 저장 / 이전 대화 불러오기

**shadcn/ui 컴포넌트**
- Card, Avatar, Input, Button, Badge, ScrollArea, Tabs, Dialog, Textarea, Select

> **v0.2 예정**: 대화 데이터 업로드(.txt/.csv) → AI 자동 인격 프로필 생성, 감정 분석 패널(긍정/중립/부정 게이지), 상황 시뮬레이션 모드, 대안 제안 힌트, 대화 내보내기

---

### 8. 설정 `/settings`

#### 8-1. 계정/권한 관리 `/settings/users`

**기능**
- 팀원 목록 테이블 (이메일, 이름, 권한, 최종 접속일)
- 권한 변경 (super만 가능)
- 계정 추가/비활성화

#### 8-2. 변경 이력 `/settings/logs`

**기능**
- 전체 변경 로그 타임라인
- 필터: 페이지별 / 작업자별 / 날짜별
- 상세 diff 조회 (변경 전/후)

> **v0.2 예정**: 롤백 버튼 (super/boss만) — FK 관계 정합성 검증 후 구현

**shadcn/ui 컴포넌트**
- DataTable, Select, DatePicker, Dialog, Button, Badge

---

## 공통 레이아웃

```
┌─────────────────────────────────────────┐
│  Logo    [Nav Links]     [User Avatar ▾] │  ← 상단 헤더
├────────┬────────────────────────────────┤
│        │                                │
│  사이드 │         메인 콘텐츠             │
│  네비   │                                │
│        │                                │
│        │                                │
├────────┴────────────────────────────────┤
│                                         │  ← 하단 (선택)
└─────────────────────────────────────────┘
```

- 사이드바: 접기/펼치기 가능
- 현재 페이지 하이라이트
- 권한에 따라 메뉴 항목 자동 필터링

---

## DB 테이블 개요

| 테이블 | 설명 |
|---|---|
| `users` | Supabase Auth 확장 — 이름, 권한(role) |
| `retrospectives` | 개인 회고 (프로젝트, 기간, KPT, SSC, 메모) |
| `retrospective_summaries` | 취합 뷰 최종 합의 사항 |
| `meetings` | 회의록 (제목, 날짜, 내용, 참석자) |
| `action_items` | 회의록 액션아이템 (담당자, 마감일, 상태) |
| `payments` | 입금/결제 요청 (금액, 은행, 계좌, 마감일, 상태) |
| `estimates` | 견적서 헤더 (프로젝트, 클라이언트, 상태) |
| `estimate_items` | 견적서 항목 (항목명, 수량, 단가, 비고) |
| `avatars` | 아바타 (이름, 소속, 직급, 이미지, 수동 프로필) |
| `avatar_profiles` | 수동 인격 프로필 (말투, 성격, 패턴, 민감주제, 메모) |
| `chat_sessions` | 예측 채팅 세션 (아바타별) |
| `chat_messages` | 채팅 메시지 (role, content) |
| ~~`avatar_training_data`~~ | ~~학습 데이터 이력~~ → **v0.2 예정** |
| `audit_logs` | 변경 이력 (테이블, row_id, 변경전, 변경후, 작업자, 시각) |

---

## 에이전트 팀 운영 모델

### 역할 구조

```
┌─────────────────────────────────────┐
│       팀장 (Opus) - Lead            │
│  · Phase 시작/완료 판단             │
│  · QA 최종 승인                     │
│  · 팀원이 못 푸는 문제만 개입        │
│  · 머지 결정                        │
│  · 평소에는 모니터링만              │
└──────────┬──────────────────────────┘
           │ 에스컬레이션만
┌──────────┴──────────────────────────┐
│      팀원 (Sonnet/Opus) - Workers   │
│                                     │
│  [Worker A] ←──메시지──→ [Worker B] │
│                                     │
│  · 서로 직접 소통하며 개발           │
│  · 공유 태스크 리스트로 진행 추적     │
│  · 충돌/블로커 발생 시 팀장에 보고    │
└─────────────────────────────────────┘
```

### 에스컬레이션 기준

| 상황 | 처리 |
|---|---|
| 일반 CRUD, UI 작업 | 팀원끼리 해결 |
| API 인터페이스 불일치 | 팀원끼리 메시지로 조율 |
| RLS 정책 충돌, Realtime 버그 | 팀원 1회 시도 → 실패 시 팀장 개입 |
| 아키텍처 변경 필요 | 즉시 팀장 에스컬레이션 |
| QA 통과 판단 | 팀장만 최종 승인 |

---

## 개발 일정 (Phase + QA + Git)

### 흐름도

```
[P0] → [P0-QA] → git: feature/p0-auth → main 머지
  │
  ├→ [P1] → [P1-QA] → git: feature/p1-retrospective → main 머지
  │                   → ✅ UAT 1차 (Auth + 회고)
  │
  ├→ [P2] ──────────┐
  │  [P3] ─┐        │
  │  [P4] ─┘ 병렬   │
  │    └────────────┘→ [P2~4-QA] → git: feature/p2~p4 → main 머지
  │                               → ✅ UAT 2차 (대시보드 + 회의록 + 입금)
  │
  ├→ [P5] ─┐
  │  [P6] ─┘ 병렬 → [P5~6-QA] → git: feature/p5,p6 → main 머지
  │
  └→ [P7] → [P7-QA + 전체 E2E] → git: feature/p7-settings → main 머지
                                → ✅ UAT 3차 (전체 회귀 테스트)
```

### Phase별 상세

| Phase | 작업 | 모델 | 에이전트 구성 | Git 브랜치 | 시드 데이터 |
|---|---|---|---|---|---|
| **P0** | 프로젝트 초기화 + Auth + 레이아웃 | Workers: Opus | 1개 순차 | `feature/p0-auth` | 7명 팀원 계정 (super 1, boss 1, manager 2, normal 3) |
| **P0-QA** | Auth 플로우 + 권한 차단 + RLS 검증 | Workers: Sonnet | 1개 code-reviewer | — | — |
| **P0-GIT** | PR 생성 → 팀장 리뷰 → main 머지 | 팀장 Opus | — | `feature/p0-auth → main` | — |
| **P1** | 회고 시스템 | Workers: Sonnet | 2개 병렬 (DB/API + UI) | `feature/p1-retrospective` | 프로젝트 1건 + 개인 회고 7건 |
| **P1-QA** | 회고 CRUD + 취합 로직 | Workers: Sonnet | 1개 code-reviewer | — | — |
| **P1-GIT** | PR → 리뷰 → 머지 | 팀장 Opus | — | `feature/p1-retrospective → main` | — |
| **✅ UAT 1차** | 사용자 직접 테스트: Auth 흐름 + 권한 차단 + 회고 폼 UX + 취합 뷰 | 사용자 | Vercel Staging | — | 로그인→회고 작성→취합 확인 시나리오 |
| **P2** | 대시보드 | Workers: Sonnet | 1개 | `feature/p2-dashboard` | P1~P4 시드에 의존 |
| **P3** | 회의록 관리 | Workers: Sonnet | 2개 병렬 (CRUD + Sheets 연동) | `feature/p3-meetings` | 회의록 3건 + 액션아이템 10건 + Sheets 샘플 |
| **P4** | 입금/결제 요청 | Workers: Sonnet | 1개 | `feature/p4-payments` | 입금 요청 10건 (은행 5곳 분산) |
| **P2~4-QA** | 대시보드 집계 + 회의록 파싱 + 입금 그룹핑 통합 테스트 | Workers: Opus | 1개 code-reviewer | — | — |
| **P2~4-GIT** | PR 3건 → 리뷰 → 순차 머지 | 팀장 Opus | — | `feature/p2,p3,p4 → main` | — |
| **✅ UAT 2차** | 사용자 직접 테스트: 대시보드 집계 + 회의록 Sheets 파싱 + 입금 그룹핑 | 사용자 | Vercel Staging | — | 대시보드 위젯 확인, 회의록 작성/임포트, 입금 등록/완료 시나리오 |
| **P5** | 견적서 순차 편집 + 퍼블리시 | Workers: Sonnet | 2개 병렬 (CRUD+잠금 + 퍼블리시/비교) | `feature/p5-estimates` | 견적서 2건 + 항목 각 10개 + 작년 1건 |
| **P6** | 클라이언트 예측 (수동 프리셋 + 채팅) | Workers: Sonnet | 1개 | `feature/p6-predict` | 아바타 3개 + 채팅 샘플 |
| **P5~6-QA** | 잠금 편집 + 퍼블리시 + Gemini 응답 검증 | Workers: Opus | 1개 code-reviewer | — | — |
| **P5~6-GIT** | PR 2건 → 리뷰 → 순차 머지 | 팀장 Opus | — | `feature/p5,p6 → main` | — |
| **P7** | 설정 + 감사 로그 조회 | Workers: Sonnet | 1개 | `feature/p7-settings` | audit_logs 50건 |
| **P7-QA** | 감사 로그 조회 + 전체 E2E 회귀 | Workers: Opus | 2개 병렬 (E2E + 코드 리뷰) | — | 전체 시드 통합 |
| **P7-GIT** | 최종 PR → 리뷰 → 머지 → `v0.1` 태그 | 팀장 Opus | — | `feature/p7-settings → main` → tag `v0.1` | — |
| **✅ UAT 3차** | 사용자 최종 테스트: 전체 플로우 회귀 + 견적서 퍼블리시 결과물 + 아바타 채팅 품질 | 사용자 | Vercel Staging | — | 전체 기능 E2E 시나리오, 퍼블리시 파일 검수, 프로덕션 배포 승인 |

### Git 운영 규칙

1. **브랜치 전략**: `main` ← `feature/pN-기능명` (Phase별 feature 브랜치)
2. **머지 권한**: 팀장(Opus)만 main에 머지 가능
3. **PR 규칙**: QA 통과 후에만 PR 생성, 팀장 승인 필수
4. **커밋 컨벤션**: `feat:`, `fix:`, `test:`, `chore:` 접두사 사용
5. **태그**: 전체 완료 시 `v0.1` 릴리스 태그

### 배포 전략

| 환경 | 플랫폼 | 용도 | 시점 |
|---|---|---|---|
| **Preview** | Vercel | PR별 자동 Preview 배포 → QA 테스트용 | feature 브랜치 push 시 자동 |
| **Staging** | Vercel | main 머지 후 통합 확인 | main push 시 자동 |
| **Production** | Vultr (Docker Compose) | 최종 프로덕션 | v0.1 태그 후 수동 배포 |

- 개발~QA는 Vercel Preview로 빠르게 확인
- main 브랜치 = Vercel Staging (항상 최신 통합 상태)
- Vultr 프로덕션은 v0.1 완성 후 Docker Compose로 배포

---

## 작업 로그 규칙

### 로그 파일 위치
```
workspace/logs/
├── PROGRESS.md            # 전체 진행 현황 (팀장 관리)
├── p0-auth.log.md         # Phase별 상세 로그
├── p1-retrospective.log.md
├── p2-dashboard.log.md
├── ...
└── p7-settings.log.md
```

### PROGRESS.md 형식 (팀장 관리)
```markdown
# 전체 진행 현황

| Phase | 상태 | 시작 | 완료 | QA | 머지 | 비고 |
|---|---|---|---|---|---|---|
| P0 | ✅ 완료 | 02/25 | 02/25 | PASS | merged | — |
| P1 | 🔄 진행중 | 02/26 | — | — | — | Worker A: DB 80%, Worker B: UI 60% |
| P2 | ⏳ 대기 | — | — | — | — | P1 완료 후 시작 |
```

### Phase별 로그 형식 (팀원 기록)
```markdown
# P1 회고 시스템 작업 로그

## [2026-02-26 14:30] Worker A
- **작업**: retrospectives 테이블 + RLS 정책 생성
- **상태**: 완료
- **다음**: API 라우트 작성 예정

## [2026-02-26 15:10] Worker B
- **작업**: 회고 입력 폼 UI 구현
- **상태**: 진행중 (70%)
- **블로커**: DateRangePicker 컴포넌트 스타일 이슈
- **조치**: Worker A에게 확인 요청

## [2026-02-26 16:00] Worker A → Worker B
- **메시지**: DateRangePicker는 shadcn/ui calendar 조합으로 해결, 코드 공유함

## [2026-02-26 17:00] Worker B
- **작업**: 블로커 해결, 폼 UI 완료
- **상태**: 완료
```

### 로그 기록 규칙

1. **기록 시점**: 작업 시작, 완료, 블로커 발생, 해결, 에스컬레이션 시 반드시 기록
2. **필수 필드**: 날짜시간, 작업자, 작업 내용, 상태
3. **블로커 발생 시**: 블로커 내용 + 시도한 해결 방법 + 조치(팀원 요청 or 팀장 에스컬레이션) 기록
4. **팀원 간 소통**: 메시지 주고받은 내용도 로그에 기록 (추적 가능하도록)
5. **QA 결과**: 테스트 항목별 PASS/FAIL + 실패 시 원인 + 수정 내역 기록
6. **팀장 업데이트**: 각 Phase 로그를 기반으로 PROGRESS.md 갱신
7. **금지 사항**: 로그 없이 코드 머지 불가, 블로커를 로그 안 남기고 넘기기 금지

---

## 퍼블리시 기술 스택

| 출력 형식 | 라이브러리 | 용도 |
|---|---|---|
| PDF | `@react-pdf/renderer` | 견적서 PDF 다운로드 |
| Excel | `exceljs` | 견적서/회의록 Excel 다운로드 |
| Google Sheets | Google Sheets API v4 (Service Account) | 회의록/견적서 Sheets 내보내기 |

- Google Sheets 연동은 Service Account 방식 (사용자별 OAuth 불필요)
- PDF 템플릿은 서버 컴포넌트에서 렌더링

---

## v0.2 로드맵

| 기능 | 설명 | 선행 조건 |
|---|---|---|
| 견적서 실시간 동시 편집 | Supabase Realtime+Presence 기반 셀 단위 동시 편집, 접속자 커서 표시 | v0.1 견적서 안정화 |
| 아바타 대화 데이터 학습 | 카카오톡/이메일 대화 업로드 → Gemini API 자동 인격 프로필 생성 | v0.1 아바타 채팅 안정화 |
| 감정 분석 패널 | 채팅 중 예상 감정(긍정/중립/부정) 게이지 + 민감 주제 경고 + 대안 제안 | 학습 시스템 완성 |
| 감사 로그 롤백 | FK 관계 정합성 보장하는 트랜잭션 기반 롤백 | v0.1 감사 로그 운영 데이터 축적 |
| 백업 자동화 | pg_dump cron job + 클라우드 스토리지(S3/GCS) 자동 업로드 | Vultr 프로덕션 배포 완료 |
| 상황 시뮬레이션 모드 | "견적 네고", "일정 변경 요청" 등 상황 프리셋으로 아바타와 롤플레이 | 학습 시스템 완성 |
| 프로젝트 리뷰 | 프로젝트 완료 후 성과 리뷰 — 목표 대비 달성도, 타임라인 분석, 팀 피드백 종합 | v0.1 회고 + 회의록 운영 데이터 축적 |
| 회의록 Google Sheets 자동 연동 | Google Sheets URL 입력 → Sheets API로 시트 데이터 읽기 → 항목 자동 분석 → 회의록 필드 자동 매핑 (제목, 참석자, 액션아이템 등) | v0.1 회의록 안정화 + Google Sheets API Service Account 연동 |
| 회의록 보기 UX 개선 | 프로젝트별 그룹핑, 액션아이템 진행률 시각화, 타임라인 뷰, 검색/필터 강화, 인쇄용 레이아웃 | v0.1 회의록 운영 데이터 축적 |
| Post-mortem | 프로젝트 완료 후 사후 분석 — 장애/이슈 타임라인, 근본 원인 분석(RCA), 교훈 도출, 재발 방지 액션아이템 관리 | v0.1 회고 + 회의록 운영 데이터 축적 |

# GRIFF-Q 0.2 전체 개발 계획

> v0.1 완료 기준(2026-02-26) 위에서 기능 고도화 + 운영 인프라 구축

---

## 1) v0.2 목표

v0.1에서 구축한 CRUD 기반 업무 도구를 **실무 운영 수준**으로 끌어올린다.

- 퍼블리시(PDF/Excel/Sheets) 완성으로 외부 산출물 생산
- 아바타 시스템 고도화 (데이터 학습 + 감정 분석 + 시뮬레이션)
- 견적서 실시간 동시 편집
- 프로젝트 단위 통합 관리 (허브 + 리뷰 + Post-mortem)
- Vultr 프로덕션 배포 + 백업 자동화

---

## 2) 기술 스택 추가

| 영역 | v0.1 | v0.2 추가 |
|---|---|---|
| 퍼블리시 | — | `@react-pdf/renderer`, `exceljs`, Google Sheets API v4 |
| 실시간 | — | Supabase Realtime + Presence |
| AI | Gemini 2.0 Flash (채팅) | + 감정 분석, 프로필 자동 생성, 시뮬레이션 프롬프트 |
| 인프라 | Vercel (개발/스테이징) | + Vultr Docker Compose (프로덕션), S3 백업 |
| 알림 | — | 인앱 알림 (notifications 테이블), Slack Webhook |
| 검색 | — | PostgreSQL full-text search (`to_tsvector`) |

---

## 3) 에이전트 팀 운영 모델

> v0.1과 동일한 팀장-팀원 구조 유지. v0.2는 Phase 복잡도에 따라 팀원 수 조절.

### 역할 구조

```
┌─────────────────────────────────────┐
│       팀장 (Opus) - Lead            │
│  · Phase 시작/완료 판단             │
│  · QA 최종 승인                     │
│  · 아키텍처 결정 (Realtime, Docker) │
│  · 머지 결정                        │
│  · 평소에는 모니터링만              │
└──────────┬──────────────────────────┘
           │ 에스컬레이션만
┌──────────┴──────────────────────────┐
│      팀원 (Sonnet/Opus) - Workers   │
│                                     │
│  [Worker A] ←──메시지──→ [Worker B] │
│       ↕                       ↕     │
│  [Worker C] ←──메시지──→ [Worker D] │
│                                     │
│  · 서로 직접 소통하며 개발           │
│  · 공유 태스크 리스트로 진행 추적     │
│  · 충돌/블로커 발생 시 팀장에 보고    │
└─────────────────────────────────────┘
```

### 모델 배정 기준

| 작업 유형 | 모델 | 이유 |
|---|---|---|
| Supabase Realtime/Presence 설계 | Opus | 동시성 제어, 충돌 해결 로직 |
| Docker Compose + 배포 스크립트 | Opus | 인프라 설정, 보안 |
| Gemini 프롬프트 엔지니어링 | Opus | 시스템 프롬프트 품질 |
| PDF/Excel 템플릿 렌더링 | Sonnet | 라이브러리 API 활용 |
| Google Sheets API 연동 | Sonnet | REST API CRUD |
| UI 컴포넌트/페이지 구현 | Sonnet | React + shadcn/ui |
| DB 마이그레이션, RLS | Sonnet | SQL 작성 |
| 테스트 작성 (Playwright) | Sonnet | E2E 테스트 |
| 간단한 버그 수정, 오타 | Haiku | 빠른 처리 |

### 에스컬레이션 기준

| 상황 | 처리 |
|---|---|
| 일반 CRUD, UI, 퍼블리시 | 팀원끼리 해결 |
| Google Sheets API 인증 이슈 | 팀원 1회 시도 → 실패 시 팀장 |
| Realtime 구독 충돌, Presence 동기화 | 즉시 팀장 에스컬레이션 |
| Docker 빌드/배포 실패 | 팀원 1회 시도 → 실패 시 팀장 |
| 아키텍처 변경 (테이블 구조, API 설계) | 즉시 팀장 에스컬레이션 |
| QA 통과 판단 | 팀장만 최종 승인 |

---

## 4) 개발 일정 (Phase + QA + Git)

### 흐름도

```
[P0] → [P0-QA] → git: feature/v2-p0-publish → main 머지
  │               → ✅ UAT 1차 (퍼블리시 결과물 검수)
  │
  ├→ [P1] ─┐
  │  [P2] ─┘ 병렬 → [P1~2-QA] → git: feature/v2-p1,p2 → main 머지
  │                              → ✅ UAT 2차 (회의록 Sheets + 아바타 학습)
  │
  ├→ [P3] → [P3-QA] → git: feature/v2-p3-realtime → main 머지
  │                   → ✅ UAT 3차 (실시간 동시 편집 2인 테스트)
  │
  ├→ [P4] → [P4-QA] → git: feature/v2-p4-project → main 머지
  │
  └→ [P5] → [P5-QA + 전체 E2E] → git: feature/v2-p5-infra → main 머지
                                 → ✅ UAT 4차 (전체 회귀 + 프로덕션 배포 승인)
                                 → tag `v0.2`
```

### Phase별 상세

| Phase | 작업 | 모델 | 에이전트 구성 | Git 브랜치 | 시드/테스트 데이터 |
|---|---|---|---|---|---|
| **P0** | 퍼블리시 + 알림 + 검색 + 반응형 | Workers: Sonnet | 3개 병렬 (퍼블리시 + 알림/검색 + 반응형) | `feature/v2-p0-publish` | 견적서 PDF 샘플, Excel 출력 검증용 데이터 |
| **P0-QA** | PDF/Excel/Sheets 출력물 검증 + 알림 동작 + 검색 정확도 + 반응형 레이아웃 | Workers: Sonnet | 1개 code-reviewer + Playwright | — | — |
| **P0-GIT** | PR → 팀장 리뷰 → main 머지 | 팀장 Opus | — | `feature/v2-p0-publish → main` | — |
| **✅ UAT 1차** | PDF 다운로드 확인, Excel 열기, Sheets 연동, 알림 수신, 모바일 UI | 사용자 | Vercel Staging | — | 견적서 PDF 출력 → 내용/레이아웃 확인, Excel 열기 → 수식/서식 확인 |
| **P1** | 회의록 강화 (Sheets 자동 연동 + UX 개선 + Sheets 퍼블리시) | Workers: Sonnet | 2개 병렬 (Sheets 연동 + UX 개선) | `feature/v2-p1-meetings` | Google Sheets 샘플 3종 (다양한 형식) |
| **P2** | 아바타 고도화 (데이터 학습 + 감정 분석 + 시뮬레이션 + 대안 제안) | Workers: Opus+Sonnet | 2개 병렬 (학습+감정 Opus + 시뮬레이션 UI Sonnet) | `feature/v2-p2-predict` | 카톡 대화 txt 샘플 3개, 이메일 csv 샘플 2개 |
| **P1~2-QA** | Sheets 읽기/쓰기 + 학습 프로필 품질 + 감정 게이지 정확도 | Workers: Opus | 1개 code-reviewer | — | — |
| **P1~2-GIT** | PR 2건 → 순차 머지 | 팀장 Opus | — | `feature/v2-p1,p2 → main` | — |
| **✅ UAT 2차** | Sheets URL 입력 → 자동 파싱 확인, 대화 업로드 → 프로필 생성 품질 확인, 감정 게이지 직관성 | 사용자 | Vercel Staging | — | 실제 회의 Sheets + 실제 카톡 대화 테스트 |
| **P3** | 견적서 실시간 동시 편집 (Realtime + Presence + 충돌 해결 + 템플릿) | Workers: Opus | 2개 병렬 (Realtime 구독 + Presence UI) | `feature/v2-p3-realtime` | 견적서 2건 (동시 편집 시나리오) |
| **P3-QA** | 2인 동시 편집 시뮬레이션 + 커서 표시 + 충돌 시 알림 + 잠금 제거 확인 | Workers: Opus | 1개 code-reviewer + Playwright 2탭 | — | — |
| **P3-GIT** | PR → 팀장 리뷰 → main 머지 | 팀장 Opus | — | `feature/v2-p3-realtime → main` | — |
| **✅ UAT 3차** | 2인 이상 동시 접속 → 같은 견적서 편집 → 커서 표시 + 충돌 처리 확인 | 사용자(2명) | Vercel Staging | — | 2대 디바이스에서 동시 편집 시나리오 |
| **P4** | 프로젝트 관리 통합 (허브 + 리뷰 + Post-mortem) | Workers: Sonnet | 2개 병렬 (허브/리뷰 + Post-mortem) | `feature/v2-p4-project` | 프로젝트 2건 + 연결된 견적서/회의록/회고 |
| **P4-QA** | 프로젝트 허브 집계 + 리뷰 차트 + Post-mortem 플로우 | Workers: Sonnet | 1개 code-reviewer | — | — |
| **P4-GIT** | PR → 머지 | 팀장 Opus | — | `feature/v2-p4-project → main` | — |
| **P5** | 운영 인프라 (Docker 배포 + 백업 + 감사 롤백 + Slack) | Workers: Opus | 2개 병렬 (Docker+백업 + 롤백+Slack) | `feature/v2-p5-infra` | audit_logs 100건 (롤백 테스트) |
| **P5-QA** | Docker 빌드+실행 + 백업 복원 + 롤백 정합성 + Slack 메시지 수신 + 전체 E2E 회귀 | Workers: Opus | 2개 병렬 (인프라 검증 + E2E 회귀) | — | 전체 시드 통합 |
| **P5-GIT** | 최종 PR → 머지 → tag `v0.2` | 팀장 Opus | — | `feature/v2-p5-infra → main` → tag `v0.2` | — |
| **✅ UAT 4차** | 전체 기능 회귀 + Vultr 프로덕션 접속 + 백업 복원 테스트 + Slack 알림 확인 | 사용자 | Vultr Production | — | 프로덕션 환경 전체 시나리오 |

---

## 5) Phase별 상세 기획

### P0: v0.1 보완 — 퍼블리시 + 알림 + 검색 + 반응형

#### P0-A: 퍼블리시 (Worker A — Sonnet)

**견적서 PDF 다운로드**
- `@react-pdf/renderer` 설치
- `src/components/estimates/estimate-pdf.tsx` — PDF 템플릿 컴포넌트
  - 회사 로고, 견적서 번호, 기본 정보 (프로젝트/클라이언트/날짜/유효기간)
  - 항목 테이블 (번호, 항목명, 수량, 단가, 금액, 비고)
  - 소계/부가세/총액
  - 하이라이트 셀 배경색 반영
- `src/app/api/estimates/[id]/pdf/route.ts` — PDF 생성 API Route
- 상세 페이지에 "PDF 다운로드" 버튼 추가

**견적서/회의록 Excel 다운로드**
- `exceljs` 설치
- `src/app/api/estimates/[id]/excel/route.ts` — 견적서 Excel
- `src/app/api/meetings/[id]/excel/route.ts` — 회의록 + 액션아이템 Excel
- 각 상세 페이지에 "Excel 다운로드" 버튼 추가

**입금/결제 목록 Excel 내보내기**
- `src/app/api/payments/export/route.ts` — 전체 입금 내역 Excel
- 목록 페이지에 "Excel 내보내기" 버튼

**Google Sheets 견적서 퍼블리시**
- Google Sheets API v4 + Service Account 연동
- `src/lib/google-sheets.ts` — Sheets API 클라이언트 래퍼
- `src/app/api/estimates/[id]/sheets/route.ts` — 견적서 → Sheets 내보내기
- 상세 페이지에 "Sheets 내보내기" 버튼

#### P0-B: 알림 + 검색 (Worker B — Sonnet)

**인앱 알림 시스템**
- DB: `supabase/migrations/008_notifications.sql`
  ```sql
  create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) not null,
    type text not null, -- 'deadline', 'lock_released', 'estimate_confirmed', ...
    title text not null,
    message text not null,
    link text, -- 클릭 시 이동 경로
    is_read boolean default false,
    created_at timestamptz default now()
  );
  ```
- `src/components/layout/notification-bell.tsx` — 헤더 벨 아이콘 + 드롭다운
  - 읽지 않은 알림 개수 배지
  - 클릭 시 최근 20건 표시
  - 알림 클릭 → link로 이동 + 읽음 처리
- 알림 트리거 (서버 사이드):
  - 마감일 임박 (3일 이내): 매일 cron 또는 대시보드 로드 시 체크
  - 견적서 잠금 해제: update 트리거
  - 견적서 확정/발송: update 트리거

**통합 검색**
- `src/app/(dashboard)/search/page.tsx` — 검색 결과 페이지
- `src/components/layout/search-bar.tsx` — 헤더 검색바 (Cmd+K 단축키)
- `src/app/api/search/route.ts` — 검색 API
  - PostgreSQL `to_tsvector('korean', ...)` + `to_tsquery` 또는 `ILIKE` 패턴
  - 검색 대상: estimates(project_name, client_name), meetings(title, content), payments(name, note), retrospectives(keeps, problems, tries)
  - 결과: 테이블별 그룹핑 + 하이라이트

#### P0-C: 모바일 반응형 (Worker C — Sonnet)

- 전 페이지 `md:` breakpoint 검수
- 테이블 → 모바일에서 카드 뷰 전환 (또는 수평 스크롤)
- 사이드바 모바일 드로어 동작 검증
- 견적서 항목 편집 모바일 UX (모달 or 아코디언)
- 채팅 인터페이스 모바일 레이아웃 (세션 목록 토글)

---

### P1: 회의록 강화

#### P1-A: Google Sheets 자동 연동 (Worker A — Sonnet)

**Sheets URL → 회의록 자동 매핑**
- `/meetings/import` 페이지 확장
  - 기존 텍스트 붙여넣기 + **신규** Sheets URL 입력 탭
  - URL 입력 → `src/app/api/meetings/import-sheets/route.ts`
  - Sheets API로 데이터 읽기 → Gemini API로 필드 자동 매핑 (제목, 날짜, 참석자, 내용, 액션아이템)
  - 매핑 결과 미리보기 → 사용자 확인 → 저장

**회의록 → Sheets 내보내기**
- `src/app/api/meetings/[id]/sheets/route.ts`
- 상세 페이지에 "Sheets 내보내기" 버튼

#### P1-B: 회의록 UX 개선 (Worker B — Sonnet)

**목록 개선**
- 프로젝트별 그룹핑 뷰 (Accordion)
- 날짜 범위 필터 (DateRangePicker)
- 키워드 검색 (제목, 내용)
- 정렬: 날짜순 / 미완료 액션아이템 우선

**액션아이템 대시보드**
- `/meetings/action-items` — 전체 액션아이템 통합 뷰
- 필터: 담당자별, 상태별, 마감일별
- 진행률 시각화 (프로그레스 바)
- 타임라인 뷰 (날짜별 카드)

**인쇄용 레이아웃**
- `@media print` CSS
- 회의록 상세 페이지 "인쇄" 버튼

---

### P2: 아바타 고도화

#### P2-A: 데이터 학습 + 감정 분석 (Worker A — Opus)

**대화 데이터 업로드**
- `/predict/avatars/[id]/upload` — 데이터 업로드 페이지
- 지원 형식: `.txt` (카카오톡 내보내기), `.csv` (이메일 대화)
- 파서: 카톡 형식 (`yyyy.mm.dd hh:mm, 이름 : 메시지`) + CSV
- `src/app/api/predict/analyze-conversation/route.ts`
  - 업로드된 대화 → Gemini API로 분석
  - 출력: 말투 스타일, 성격 키워드, 의사결정 패턴, 민감 주제 자동 추출
  - 추출된 프로필 → 아바타 인격 프로필에 자동 반영 (사용자 확인 후)

**감정 분석 패널**
- `src/components/predict/sentiment-gauge.tsx` — 감정 게이지 컴포넌트
  - 긍정 / 중립 / 부정 3단계 게이지 바
  - 민감 주제 감지 시 경고 배지
- 채팅 API에 감정 분석 추가:
  - Gemini 응답 시 JSON 구조로 `{ reply, sentiment: 'positive'|'neutral'|'negative', warning?: string }`
  - 시스템 프롬프트에 감정 메타데이터 출력 지시 추가

**대안 제안 힌트**
- 부정 감정 감지 시 → "이렇게 말해보세요" 대안 3가지 제안
- 시스템 프롬프트 분기: 감정이 negative이면 대안 제안 모드 활성화

#### P2-B: 시뮬레이션 UI (Worker B — Sonnet)

**상황 시뮬레이션 모드**
- `/predict/chat/[avatarId]` 에 시뮬레이션 모드 토글 추가
- 프리셋 시나리오 목록:
  - 견적 네고 ("가격을 10% 낮춰주세요")
  - 일정 변경 요청 ("납기를 2주 앞당겨주세요")
  - 불만 접수 ("결과물이 기대와 다릅니다")
  - 추가 요청 ("여기에 기능 하나 더 추가해주세요")
  - 커스텀 시나리오 (자유 입력)
- 시나리오 선택 → 시스템 프롬프트에 상황 컨텍스트 주입
- 시뮬레이션 결과 저장 (별도 세션 태그)

**대화 내보내기**
- 채팅 세션 → 텍스트/PDF 다운로드
- 요약 생성: Gemini API로 대화 요약 + 핵심 포인트 추출

---

### P3: 견적서 실시간 동시 편집

> 난이도 높음 — Opus 전용 Phase

#### P3-A: Realtime 구독 (Worker A — Opus)

**Supabase Realtime 채널**
- `estimate:{id}` 채널 구독
- estimate_items 변경 시 실시간 브로드캐스트
- 충돌 해결: 마지막 저장 우선 (Last Writer Wins) + 변경 알림
- 잠금 해제: v0.1 잠금 방식 제거 → Realtime 기반 동시 편집으로 전환
- DB: `estimate_items`에 `last_edited_by`, `last_edited_at` 컬럼 추가

**셀 단위 업데이트**
- 항목 수정 시 전체 저장 → 셀 단위 debounce 저장 (300ms)
- `supabase.from("estimate_items").update({ unit_price }).eq("id", itemId)`
- Realtime 이벤트 수신 → 해당 셀만 업데이트 (전체 리렌더 방지)

#### P3-B: Presence UI (Worker B — Opus)

**접속자 표시**
- Supabase Presence로 현재 편집 중인 사용자 목록
- 상단에 접속자 아바타 표시 (최대 5명 + "+N")
- 각 사용자의 현재 편집 셀 위치 표시 (셀 테두리 색상)

**충돌 알림**
- 동일 셀 동시 편집 감지 → Toast 알림 ("OOO님이 이 항목을 수정했습니다")
- 충돌 발생 시 최신 값 자동 반영 + 이전 값 undo 가능

**견적서 템플릿**
- `/estimates/templates` — 템플릿 목록 페이지
- 자주 사용하는 항목 세트를 템플릿으로 저장
- 견적서 생성 시 템플릿 선택 → 항목 자동 채움
- DB: `estimate_templates`, `estimate_template_items` 테이블

---

### P4: 프로젝트 관리 통합

#### P4-A: 프로젝트 허브 + 리뷰 (Worker A — Sonnet)

**프로젝트 허브**
- `/projects` — 프로젝트 목록
- `/projects/[id]` — 프로젝트 상세 (허브)
  - 연결된 견적서, 회의록, 회고, 입금 요청을 한 화면에 표시
  - 탭: 개요 / 견적서 / 회의록 / 회고 / 입금
- DB: `projects` 테이블 확장 (현재 retrospectives에 project_name으로만 존재)
  - `projects`에 상태 (진행중/완료/보류), 시작일, 종료일, 담당자 추가
  - 견적서/회의록/입금에 `project_id` FK 추가 (nullable, 점진 마이그레이션)

**프로젝트 리뷰**
- `/projects/[id]/review` — 프로젝트 완료 후 성과 리뷰
  - 목표 대비 달성도 (수동 입력)
  - 타임라인 분석: 회의록 날짜 기준 이벤트 타임라인
  - 팀 피드백 종합: 해당 프로젝트 회고 통합 인사이트 연동
  - 견적 vs 실제 비용 비교 (입금 데이터 연동)

#### P4-B: Post-mortem (Worker B — Sonnet)

**Post-mortem 시스템**
- `/projects/[id]/postmortem` — 사후 분석 페이지
- DB: `postmortems` 테이블
  ```
  id, project_id, title, incident_date, severity(low/medium/high/critical),
  timeline (jsonb), root_cause, lessons_learned, action_items (jsonb),
  created_by, created_at, updated_at
  ```
- 입력 폼:
  - 사건 제목, 날짜, 심각도
  - 타임라인: 시간순 이벤트 동적 추가 (시각 + 내용)
  - 근본 원인 (Textarea)
  - 교훈 도출 (동적 리스트)
  - 재발 방지 액션아이템 (담당자 + 마감일 + 상태)
- 뷰:
  - 타임라인 시각화 (세로 타임라인 UI)
  - 심각도 배지 색상 코딩

---

### P5: 운영 인프라

#### P5-A: Docker 배포 + 백업 (Worker A — Opus)

**Docker Compose 프로덕션 배포**
- `docker/Dockerfile` — Next.js standalone 빌드
- `docker/docker-compose.yml` — Next.js + Nginx 리버스 프록시
- `docker/nginx.conf` — SSL (Let's Encrypt), gzip, 캐시 헤더
- `docker/.env.production` — 프로덕션 환경변수 템플릿
- `scripts/deploy.sh` — Vultr 서버 배포 스크립트 (ssh + docker compose up)

**백업 자동화**
- `scripts/backup.sh` — pg_dump + gzip + S3 업로드
- `scripts/restore.sh` — S3 → pg_restore
- cron job: 매일 03:00 UTC 자동 백업
- 보관 정책: 7일 일별 + 4주 주별 + 3개월 월별

#### P5-B: 감사 롤백 + Slack (Worker B — Opus)

**감사 로그 롤백**
- `/settings/logs` 상세 다이얼로그에 "롤백" 버튼 추가 (super/boss만)
- `src/app/api/audit/rollback/route.ts`
  - FK 정합성 검증: 롤백 대상 행의 참조 관계 확인
  - 트랜잭션 기반: BEGIN → UPDATE/DELETE → audit_log INSERT → COMMIT
  - 실패 시 자동 ROLLBACK + 에러 메시지
- 롤백 가능 조건:
  - update → old_data로 복원
  - insert → 해당 행 삭제 (참조 없는 경우만)
  - delete → old_data로 재삽입 (ID 충돌 검사)
- 롤백 불가 시 사유 표시 (FK 참조 존재 등)

**Slack Webhook 알림**
- `.env`에 `SLACK_WEBHOOK_URL` 추가
- `src/lib/slack.ts` — Slack 메시지 전송 헬퍼
- 알림 이벤트:
  - 마감일 임박 (3일 이내) — 매일 요약
  - 견적서 확정/발송
  - 입금 완료 처리
  - Post-mortem 생성
- 채널: `#griff-q-alerts`
- 메시지 형식: Slack Block Kit (제목, 내용, 링크 버튼)

---

## 6) DB 마이그레이션 계획

| 마이그레이션 | Phase | 테이블/변경사항 |
|---|---|---|
| `008_notifications.sql` | P0 | notifications 테이블 |
| `009_search_index.sql` | P0 | GIN 인덱스 (to_tsvector) for 검색 |
| `010_meetings_enhance.sql` | P1 | meetings에 project_id FK 추가, action_items에 인덱스 |
| `011_avatar_uploads.sql` | P2 | avatar_training_data 테이블 (업로드 이력) |
| `012_realtime_estimates.sql` | P3 | estimate_items에 last_edited_by/at, estimate_templates/items 테이블 |
| `013_projects.sql` | P4 | projects 테이블 확장, estimates/meetings/payments에 project_id FK, postmortems 테이블 |
| `014_audit_rollback.sql` | P5 | audit_logs에 rollback_of UUID FK (롤백 연쇄 추적) |

---

## 7) 테스트 전략

### 자동화 테스트 (Playwright)

| Phase | 테스트 시나리오 | 검증 항목 |
|---|---|---|
| P0 | PDF 다운로드 → 파일 크기 > 0 확인 | PDF 생성 성공 |
| P0 | Excel 다운로드 → 파일 열기 → 시트 존재 확인 | Excel 구조 |
| P0 | 알림 벨 클릭 → 드롭다운 → 읽음 처리 | 알림 CRUD |
| P0 | Cmd+K → 검색바 → 키워드 입력 → 결과 표시 | 통합 검색 |
| P0 | 모바일 뷰포트 → 테이블 카드 전환 → 폼 입력 | 반응형 |
| P1 | Sheets URL 입력 → 파싱 결과 미리보기 → 저장 | Sheets 연동 |
| P1 | 회의록 목록 → 프로젝트 필터 → 검색 → 정렬 | UX 개선 |
| P2 | txt 업로드 → 분석 → 프로필 자동 채움 → 확인 | 학습 파이프라인 |
| P2 | 채팅 → 감정 게이지 변화 → 경고 표시 | 감정 분석 |
| P2 | 시뮬레이션 시나리오 선택 → 채팅 → 결과 저장 | 시뮬레이션 |
| P3 | 2탭 동시 접속 → 같은 견적서 → 셀 수정 → 실시간 반영 | Realtime |
| P3 | 접속자 아바타 표시 → 편집 셀 하이라이트 | Presence |
| P4 | 프로젝트 허브 → 연결 데이터 표시 → 리뷰 작성 | 허브 통합 |
| P4 | Post-mortem 생성 → 타임라인 → 액션아이템 | Post-mortem |
| P5 | Docker build → 컨테이너 실행 → 헬스체크 | 배포 |
| P5 | 롤백 버튼 → 확인 → 데이터 복원 확인 | 롤백 정합성 |
| P5 | 전체 E2E 회귀: 로그인→회고→회의록→입금→견적서→채팅→설정 | 회귀 |

### 수동 테스트 (UAT)

| UAT | 테스트 시나리오 | 참여자 |
|---|---|---|
| 1차 | PDF/Excel 출력물 내용 확인, 모바일 실기기 테스트 | 사용자 1명 |
| 2차 | 실제 Sheets 데이터로 연동 테스트, 실제 카톡 대화로 학습 테스트 | 사용자 1명 |
| 3차 | 2인 동시 견적서 편집 (실기기 2대) | 사용자 2명 |
| 4차 | Vultr 프로덕션 전체 플로우 + 팀원 3명 이상 동시 접속 | 사용자 3명+ |

---

## 8) Git 운영 규칙

> v0.1과 동일 + v0.2 네이밍 규칙 추가

1. **브랜치 전략**: `main` ← `feature/v2-pN-기능명` (v2 접두사)
2. **머지 권한**: 팀장(Opus)만 main에 머지 가능
3. **PR 규칙**: QA 통과 후에만 PR 생성, 팀장 승인 필수
4. **커밋 컨벤션**: `feat:`, `fix:`, `test:`, `chore:`, `infra:` 접두사
5. **태그**: 전체 완료 시 `v0.2` 릴리스 태그
6. **핫픽스**: `hotfix/v2-이슈명` 브랜치 → main 직접 머지 (긴급 시)

---

## 9) 배포 전략

| 환경 | 플랫폼 | 용도 | 시점 |
|---|---|---|---|
| **Preview** | Vercel | PR별 자동 Preview 배포 → QA 테스트용 | feature 브랜치 push 시 자동 |
| **Staging** | Vercel | main 머지 후 통합 확인 | main push 시 자동 |
| **Production** | Vultr (Docker Compose) | 최종 프로덕션 | P5 완료 후 수동 배포 |

- **P0~P4**: Vercel Preview/Staging에서 개발+테스트
- **P5**: Docker Compose 구성 + Vultr 서버 세팅 + 프로덕션 최초 배포
- **이후**: `main` push → Staging 자동 → 수동 승인 → Vultr 배포

---

## 10) 작업 로그 규칙

> v0.1과 동일

### 로그 파일 위치
```
workspace/logs/
├── PROGRESS-v2.md              # v0.2 전체 진행 현황 (팀장 관리)
├── v2-p0-publish.log.md
├── v2-p1-meetings.log.md
├── v2-p2-predict.log.md
├── v2-p3-realtime.log.md
├── v2-p4-project.log.md
└── v2-p5-infra.log.md
```

### 기록 규칙
1. 작업 시작/완료/블로커/해결/에스컬레이션 시 반드시 기록
2. 필수 필드: 날짜시간, 작업자(Worker 식별), 작업 내용, 상태
3. 블로커 → 시도 방법 + 조치(팀원 요청 or 팀장 에스컬레이션)
4. QA 결과: 항목별 PASS/FAIL + 실패 원인 + 수정 내역
5. 로그 없이 코드 머지 불가

---

## 11) 리스크 & 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| Supabase Realtime 연결 불안정 | P3 견적서 동시 편집 실패 | 폴백: v0.1 잠금 방식 유지 + 재연결 로직 |
| Google Sheets API 할당량 초과 | P0/P1 Sheets 연동 실패 | 일일 요청 수 모니터링 + 캐싱 |
| Gemini API 응답 지연/품질 | P2 감정 분석/학습 부정확 | 타임아웃 설정 + 프롬프트 버전 관리 + 폴백 메시지 |
| Vultr 서버 장애 | P5 프로덕션 다운 | 헬스체크 + 자동 재시작 (Docker restart: always) + 백업 |
| 카톡 대화 형식 다양성 | P2 파서 실패 | 주요 형식 3종 지원 + 파싱 실패 시 수동 입력 안내 |

---

## 12) v0.3 로드맵 (예비)

| 기능 | 설명 |
|---|---|
| 클라이언트 포털 | 외부 클라이언트 전용 견적서 확인/승인 공개 링크 |
| 대시보드 커스터마이징 | 위젯 순서 변경, 숨기기, 개인 설정 저장 |
| 이메일 알림 | Slack 외 이메일 알림 채널 추가 (Resend API) |
| API 키 관리 | 외부 연동용 API 키 생성/관리 페이지 |
| 다국어 지원 | next-intl 기반 영문/한글 전환 |
| 성능 최적화 | ISR, Edge Runtime, 이미지 최적화, 번들 분석 |

# GRIFF-Q 0.2 전체 개발 계획

> v0.1 완료 기준(2026-02-26) 위에서 기능 고도화 + 운영 인프라 구축
> **최종 업데이트: 2026-02-27 (5차)**

---

## 0) 진행 현황 요약

| Phase | 작업 | 상태 | 비고 |
|---|---|---|---|
| **v0.1** | Auth + 레이아웃 + 대시보드 | ✅ 완료 | |
| **v0.1** | 회고 (KPT+SSC) | ✅ 완료 | |
| **v0.1** | 회의록 (CRUD+액션아이템) | ✅ 완료 | |
| **v0.1** | 입금/결제 | ✅ 완료 | |
| **v0.1** | 견적서 (CRUD+비교+잠금) | ✅ 완료 | |
| **v0.1** | 클라이언트 예측 (아바타+Gemini) | ✅ 완료 | |
| **v0.1** | 설정 + 감사 로그 | ✅ 완료 | |
| **추가** | 다크모드 | ✅ 완료 | |
| **추가** | 회고 점수 시스템 (만족도+파트별+종합의견) | ✅ 완료 | 엑셀 기반 설계 반영 |
| **추가** | 취합 뷰 5탭 (만족도/파트별/KPT+SSC/종합교훈/참여현황) | ✅ 완료 | |
| **추가** | 포스트모템 타임라인 회고 구조 | ✅ 완료 | 타임라인별 근본원인/교훈/액션아이템 |
| **추가** | 포스트모템 목록에 작성 버튼 | ✅ 완료 | 프로젝트 선택 드롭다운 |
| **추가** | 회고 메뉴 트리 (사용가이드/스프린트/포스트모템) | ✅ 완료 | |
| **추가** | 회고 사용가이드 페이지 | ✅ 완료 | |
| **추가** | 입금/결제 트리 메뉴 (결제/대량전송/계산서) | ✅ 완료 | 대량전송·계산서는 v0.3 |
| **추가** | 결제 페이지 복사 기능 (계좌번호/금액) | ✅ 완료 | |
| **추가** | 프로젝트 메뉴 비활성화 (v0.3 리워크 예정) | ✅ 완료 | |
| **추가** | 아바타 성격 분석 강화 + 채팅 UX 개선 | ✅ 완료 | |
| **추가** | GRIFF-Q 로고 + 파비콘 적용 | ✅ 완료 | SVG 로고 사이드바 중앙정렬, 미니 로고 파비콘 |
| **P0-A** | 퍼블리시 (PDF/Excel/Sheets) | ✅ 완료 | 견적서 PDF/Excel/Sheets, 회의록 Excel/Sheets, 결제 Excel |
| **P0-B** | 인앱 알림 시스템 | ✅ 완료 | 벨 컴포넌트+마감 임박 자동 알림+결제 완료 알림 트리거 |
| **P0-B** | 통합 검색 | ✅ 완료 | Cmd+K 검색바, ILIKE 4카테고리 검색 (견적서/회의록/입금/회고) |
| **P0-C** | 모바일 반응형 | ✅ 완료 | 19개 페이지 반응형 처리, 테이블 스크롤, 헤더 스택 |
| **P1** | 회의록 강화 (검색+필터+액션아이템+인쇄) | ✅ 완료 | 목록 UX개선, 액션아이템 대시보드, 인쇄 레이아웃 |
| **P2** | 아바타 고도화 (학습+감정분석+시뮬레이션) | ✅ 완료 | 업로드+분석+시뮬레이션+학습데이터 관리 UI |
| **P3** | 견적서 실시간 동시 편집 | ✅ 완료 | Realtime+Presence+셀 커서+자동저장, 메뉴 분리 (심플/동시) |
| **P4** | 프로젝트 관리 통합 | ⏸️ v0.3 이관 | 허브+리뷰는 v0.3에서 재설계 |
| **P4-B** | Post-mortem | ✅ 완료 | 타임라인 회고 구조로 고도화 완료 |
| **P5** | 운영 인프라 (Docker+백업+Slack) | ⏸️ v0.4 이관 | |

---

## 1) v0.2 목표

v0.1에서 구축한 CRUD 기반 업무 도구를 **실무 운영 수준**으로 끌어올린다.

- 퍼블리시(PDF/Excel/Sheets) 완성으로 외부 산출물 생산
- 아바타 시스템 고도화 (데이터 학습 + 감정 분석 + 시뮬레이션)
- 견적서 실시간 동시 편집
- ~~프로젝트 단위 통합 관리 (허브 + 리뷰 + Post-mortem)~~ → **v0.3 이관** (Post-mortem만 완료)
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
  ├→ [P4] → v0.3 이관 (Post-mortem만 완료)
  │
  └→ [P5] → [P5-QA + 전체 E2E] → git: feature/v2-p5-infra → main 머지
                                 → ✅ UAT 4차 (전체 회귀 + 프로덕션 배포 승인)
                                 → tag `v0.2`
```

### Phase별 상세

| Phase | 작업 | 상태 | 모델 | Git 브랜치 |
|---|---|---|---|---|
| **P0** | 퍼블리시 + 알림 + 검색 + 반응형 | ✅ 완료 | Workers: Sonnet | main 직접 |
| **P1** | 회의록 강화 (검색+필터+액션아이템+인쇄) | ✅ 완료 | Workers: Sonnet | main 직접 |
| **P2** | 아바타 고도화 (학습 + 감정 + 시뮬레이션) | 🔲 미착수 | Workers: Opus+Sonnet | `feature/v2-p2-predict` |
| **P3** | 견적서 실시간 동시 편집 | 🔲 미착수 | Workers: Opus | `feature/v2-p3-realtime` |
| **P4** | 프로젝트 관리 통합 | ⏸️ v0.3 이관 | — | — |
| **P4-B** | Post-mortem | ✅ 완료 | Workers: Sonnet | main 직접 |
| **P5** | 운영 인프라 | 🔲 미착수 | Workers: Opus | `feature/v2-p5-infra` |

---

## 5) Phase별 상세 기획

### P0: v0.1 보완 — 퍼블리시 + 알림 + 검색 + 반응형

#### P0-A: 퍼블리시 (Worker A — Sonnet) — ✅ 완료

> 견적서 PDF/Excel/Sheets, 회의록 Excel/Sheets, 결제 Excel 모두 구현 완료

**견적서 PDF 다운로드** ✅
- `@react-pdf/renderer` 설치 ✅
- `src/app/api/estimates/[id]/pdf/route.ts` — NotoSansKR 한글 폰트, A4 레이아웃 ✅
- 견적서 상세 페이지에 "PDF" 다운로드 버튼 ✅

**견적서/회의록 Excel 다운로드** ✅
- `exceljs` 설치 ✅
- `src/app/api/estimates/[id]/excel/route.ts` — 견적정보+견적항목 2시트 ✅
- `src/app/api/meetings/[id]/excel/route.ts` — 회의록+액션아이템 2시트 ✅
- 각 상세 페이지에 "Excel" 다운로드 버튼 ✅

**입금/결제 목록 Excel 내보내기** ✅
- `src/app/api/payments/export/route.ts` — 전체 입금 내역 Excel ✅
- 결제 목록 페이지에 "Excel" 내보내기 버튼 ✅

**Google Sheets 퍼블리시** ✅
- `googleapis` 설치, Service Account 인증 ✅
- `src/lib/google-sheets.ts` — 견적서/회의록 Sheets 내보내기 ✅
- 견적서/회의록 상세 페이지에 "Sheets" 내보내기 버튼 ✅

#### P0-B: 알림 + 검색 (Worker B — Sonnet) — ✅ 완료

> 알림 트리거(마감 임박/결제 완료) + 통합 검색(ILIKE 4카테고리) 구현 완료

**인앱 알림 시스템**
- DB: `supabase/migrations/008_notifications.sql` ✅ 파일 존재
- `src/components/layout/notification-bell.tsx` ✅ 파일 존재
  - 읽지 않은 알림 개수 배지
  - 클릭 시 최근 20건 표시
  - 알림 클릭 → link로 이동 + 읽음 처리
- 알림 트리거 (서버 사이드): ✅ 구현 완료
  - 마감일 임박 (3일 이내): 대시보드 로드 시 자동 체크 + 중복 방지
  - 결제 완료: 전체 활성 유저에게 알림 생성
  - `src/lib/notifications.ts` — 알림 생성 헬퍼 (단일/전체/마감 임박 체크)

**통합 검색**
- `src/app/(dashboard)/search/page.tsx` ✅
- `src/components/layout/search-bar.tsx` ✅ Cmd+K 단축키, 300ms 디바운스
- `src/app/api/search/route.ts` ✅ ILIKE 패턴 매칭, 카테고리별 5건 제한
- 검색 대상: 견적서(프로젝트/클라이언트), 회의록(제목/내용), 입금(이름/비고), 회고(KPT)

#### P0-C: 모바일 반응형 (Worker C — Sonnet) — ✅ 완료

- 19개 페이지 반응형 처리 완료
- 페이지 헤더: `flex-col sm:flex-row` 패턴 (모바일 세로 스택)
- 테이블: `overflow-x-auto` 가로 스크롤 처리
- 2열 그리드: `grid-cols-1 sm:grid-cols-2` 모바일 1열
- 채팅 인터페이스: `flex-col md:flex-row` (모바일 세로 레이아웃, 사이드바 높이 제한)
- 버튼 그룹: `flex-wrap` 줄바꿈 처리

---

### P1: 회의록 강화 — ✅ 완료

#### P1-A: Sheets 내보내기 — ✅ 완료 (P0-A에서 구현)
- `src/app/api/meetings/[id]/sheets/route.ts` ✅
- 상세 페이지에 "Sheets 내보내기" 버튼 ✅

#### P1-B: 회의록 UX 개선 — ✅ 완료

**목록 개선** ✅
- `src/components/meetings/meeting-list-client.tsx` — 클라이언트 필터 컴포넌트
- 키워드 검색 (제목/내용), 날짜 범위 필터 (7일/30일/90일/전체), 정렬 (최신/오래된/완료 액션아이템순)
- `useMemo` 기반 클라이언트 사이드 필터링

**액션아이템 대시보드** ✅
- `/meetings/action-items` — 통합 뷰 + 담당자 필터 추가
- shadcn `Progress` 컴포넌트로 진행률 시각화
- 회의록 메뉴에 "액션아이템" 서브메뉴 추가 (`constants.ts`)

**인쇄용 레이아웃** ✅
- `src/components/meetings/print-button.tsx` — 인쇄 버튼
- `globals.css` — `@media print` (사이드바/헤더 숨김, A4 최적화, 깔끔한 테이블/배지)

---

### P2: 아바타 고도화 — 🔲 미착수

> 업로드 페이지 스캐폴딩만 존재

#### P2-A: 데이터 학습 + 감정 분석 (Worker A — Opus)

**대화 데이터 업로드**
- `/predict/avatars/[id]/upload` — 데이터 업로드 페이지 ✅ 파일 존재
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

### P3: 견적서 실시간 동시 편집 — 🔲 미착수

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
- `/estimates/templates` — 템플릿 목록 페이지 ✅ 파일 존재
- 자주 사용하는 항목 세트를 템플릿으로 저장
- 견적서 생성 시 템플릿 선택 → 항목 자동 채움
- DB: `estimate_templates`, `estimate_template_items` 테이블 ✅ 마이그레이션 존재

---

### P4: 프로젝트 관리 통합 — ⏸️ v0.3 이관

> **결정 사항 (2026-02-26)**: 프로젝트 메뉴를 다른 용도로 재설계 예정.
> 현재 견적서/회의록/회고/입금과의 연결은 불필요하므로 v0.3에서 리워크.
> Post-mortem만 v0.2에서 완료.

#### P4-A: 프로젝트 허브 + 리뷰 — ⏸️ v0.3 이관

- `/projects` 프로젝트 목록 ✅ 파일 존재 (사이드바 비활성)
- `/projects/[id]` 프로젝트 상세 ✅ 파일 존재 (사이드바 비활성)
- `/projects/[id]/review` 리뷰 ✅ 파일 존재 (사이드바 비활성)
- 모두 v0.3에서 용도 재정의 후 리워크

#### P4-B: Post-mortem — ✅ 완료

**Post-mortem 시스템**
- `/projects/[id]/postmortem` — 사후 분석 페이지 ✅
- `/retrospective/postmortem` — 포스트모템 목록 + 작성 버튼 ✅
- DB: `postmortems` 테이블 (009 마이그레이션) ✅
- **타임라인 회고 구조로 고도화** (원래 계획보다 확장):
  - 각 타임라인 항목에 날짜+시간+제목+설명+근본원인+교훈+액션아이템 포함
  - Accordion UI로 접기/펼치기
  - 뷰 페이지: 근본원인(빨강)/교훈(파랑)/액션아이템(초록) 색상 구분
  - 하위 호환: 기존 DB 컬럼에도 통합 데이터 저장
- 심각도 배지 색상 코딩 ✅

---

### P5: 운영 인프라 — 🔲 미착수

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

| 마이그레이션 | Phase | 테이블/변경사항 | 상태 |
|---|---|---|---|
| `008_notifications.sql` | P0 | notifications 테이블 | ✅ 파일 존재 |
| `009_projects_enhance.sql` | P4 | projects 확장 + postmortems + avatar_training_data + estimate_templates | ✅ 적용됨 |
| `011_retrospective_scoring.sql` | 추가 | retrospectives에 점수/종합의견, summaries에 이슈/액션/교훈 | ✅ 적용됨 |
| `009_search_index.sql` | P0 | GIN 인덱스 (to_tsvector) for 검색 | 🔲 미생성 |
| `010_meetings_enhance.sql` | P1 | meetings에 project_id FK 추가, action_items에 인덱스 | 🔲 미생성 |
| `012_realtime_estimates.sql` | P3 | estimate_items에 last_edited_by/at | 🔲 미생성 |
| `014_audit_rollback.sql` | P5 | audit_logs에 rollback_of UUID FK | 🔲 미생성 |

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
| ~~P4~~ | ~~프로젝트 허브 → 연결 데이터 표시 → 리뷰 작성~~ | ~~v0.3 이관~~ |
| P4-B | Post-mortem 생성 → 타임라인 회고 → 액션아이템 | ✅ 수동 테스트 완료 |
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

- **P0~P3**: Vercel Preview/Staging에서 개발+테스트
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

| 기능 | 설명 | 상태 |
|---|---|---|
| 프로젝트 메뉴 리워크 | 프로젝트를 다른 용도로 재설계, 견적서/회의록/회고/입금 연결 해제 | 사이드바 비활성 처리 완료 |
| 결제 대량전송 | 복수 항목 선택 → 은행 대량전송용 엑셀 다운로드 | 사이드바 비활성 처리 완료 |
| 계산서 발행 조회 | 외부 API 연동 세금계산서 발행 여부 확인 | 사이드바 비활성 처리 완료 |
| 견적서 고도화1 — 워크플로우 | 심플 견적(초안) → 동시편집(최종) 흐름 연결, 초안→최종 전환 UI | |
| 견적서 고도화2 — 템플릿화 | 자주 쓰는 항목 세트 템플릿 저장/불러오기 고도화 (카테고리, 즐겨찾기) | |
| 견적서 고도화3 — DB 불러오기/비교 | 기존 견적서 DB에서 항목 불러오기 + 버전 간 금액 변동 비교 뷰 | |
| 견적서 고도화4 — 오류체크 | 필수 항목 누락, 단가 0원, 중복 항목명, 합계 불일치 등 자동 검증 | |
| 뉴스 큐레이션 | AI / Design / Tools 3카테고리 뉴스 아티클 수집·정리 메뉴 | |
| 클라이언트 포털 | 외부 클라이언트 전용 견적서 확인/승인 공개 링크 | |
| 대시보드 커스터마이징 | 위젯 순서 변경, 숨기기, 개인 설정 저장 | |
| 이메일 알림 | Slack 외 이메일 알림 채널 추가 (Resend API) | |
| API 키 관리 | 외부 연동용 API 키 생성/관리 페이지 | |
| 다국어 지원 | next-intl 기반 영문/한글 전환 | |
| 성능 최적화 | ISR, Edge Runtime, 이미지 최적화, 번들 분석 | |

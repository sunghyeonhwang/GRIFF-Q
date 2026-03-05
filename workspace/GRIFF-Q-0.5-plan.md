# GRIFF-Q v0.5 — 견적/금융 고도화

> 견적서·결제 모듈을 실무 운영 수준으로 고도화
> **상태: 초안 (2026-03-05)**

---

## 0) 배경

v0.1~v0.2에서 견적서/결제 기본 기능을 구현했으나,
실무에서 요구하는 워크플로우·템플릿·검증·외부 연동이 부족하다.

---

## 1) 범위 (7개 항목)

### 견적서 고도화 (4개)

| # | 기능 | 설명 |
|---|------|------|
| 1 | **견적서 워크플로우** | 심플 견적(초안) → 동시편집(최종) 흐름 연결. 상태 전환: 초안→검토→확정→발송 |
| 2 | **견적서 오류체크** | 필수 항목 누락, 단가 0원, 중복 항목명, 합계 불일치 등 자동 검증. 저장/발송 전 검증 게이트 |
| 3 | **견적서 템플릿 고도화** | 카테고리 분류, 즐겨찾기, 최근 사용, 템플릿 공유/복제 |
| 4 | **견적서 DB 불러오기/비교** | 기존 견적서에서 항목 불러오기 + 버전 간 금액 비교 뷰 (diff 스타일) |

### 결제/금융 (2개)

| # | 기능 | 설명 |
|---|------|------|
| 5 | **결제 대량전송** | 복수 항목 체크박스 선택 → 은행 대량이체용 Excel 다운로드 (양식: 국민/신한/하나 등) |
| 6 | **계산서 발행 조회** | 외부 API 연동 (홈택스/팝빌 등) 세금계산서 발행 여부 확인 + 상태 동기화 |

### 외부 공개 (1개)

| # | 기능 | 설명 |
|---|------|------|
| 7 | **클라이언트 포털** | 외부 클라이언트 전용 공개 링크. 견적서 확인 + 승인/반려 + 코멘트. 로그인 불필요 (토큰 기반) |

---

## 2) 기술 스택 추가 (예상)

| 영역 | 패키지/서비스 | 용도 |
|---|---|---|
| Excel 생성 | `exceljs` 또는 `xlsx` | 대량전송 Excel 양식 |
| 세금계산서 API | 팝빌 API 또는 홈택스 연동 | 계산서 발행 조회 |
| 공개 링크 | Next.js public route + JWT 토큰 | 클라이언트 포털 |

---

## 3) DB 스키마 (예상)

**estimate_versions 테이블 (신규)** — 견적서 버전 비교용

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `estimate_id` | uuid | FK → estimates |
| `version_number` | integer | 버전 번호 |
| `snapshot` | jsonb | 해당 시점 견적서 전체 스냅샷 |
| `created_at` | timestamptz | 스냅샷 시점 |
| `created_by` | uuid | FK → users |

**estimate_workflow_logs 테이블 (신규)** — 워크플로우 상태 전환 기록

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `estimate_id` | uuid | FK → estimates |
| `from_status` | text | 이전 상태 |
| `to_status` | text | 새 상태 |
| `changed_by` | uuid | FK → users |
| `note` | text | 메모 |
| `created_at` | timestamptz | 전환 시점 |

**client_portal_links 테이블 (신규)** — 클라이언트 포털 공개 링크

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `estimate_id` | uuid | FK → estimates |
| `token` | text | 공개 접근 토큰 (UNIQUE) |
| `client_name` | text | 클라이언트명 |
| `client_email` | text | 이메일 (선택) |
| `status` | enum | `pending` / `approved` / `rejected` |
| `comment` | text | 클라이언트 코멘트 |
| `expires_at` | timestamptz | 만료 시점 |
| `created_at` | timestamptz | 생성 시점 |

---

## 4) 페이지 구성 (예상)

```
/estimates/[id]/workflow             # 견적서 워크플로우 뷰
/estimates/[id]/validate             # 오류체크 결과
/estimates/[id]/compare              # 버전 비교 (기존 페이지 확장)
/estimates/templates                 # 템플릿 관리 (기존 페이지 고도화)
/payments/bulk-download              # 대량전송 Excel 다운로드
/payments/invoice                    # 계산서 발행 조회
/portal/[token]                      # 클라이언트 포털 (공개 라우트)
```

---

## 5) 의존성

- v0.3과 독립적 (병렬 개발 가능)
- 기존 estimates, payments 테이블 확장

---

## 6) 완료 기준 (초안)

- [ ] 견적서 워크플로우 (초안→검토→확정→발송) 상태 전환
- [ ] 견적서 오류체크 자동 검증 (저장/발송 전 게이트)
- [ ] 견적서 템플릿 카테고리/즐겨찾기
- [ ] 견적서 버전 비교 뷰
- [ ] 결제 대량전송 Excel 다운로드
- [ ] 계산서 발행 조회 (외부 API)
- [ ] 클라이언트 포털 공개 링크 + 승인/반려
- [ ] 라이트/다크 × 모바일/데스크톱 4조합 정상

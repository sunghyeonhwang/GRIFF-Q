# GRIFF-Q v0.6 — 분석 & 확장

> 축적된 데이터를 분석하고, 부가 기능으로 확장
> **상태: 초안 (2026-03-05)**

---

## 0) 배경

v0.3~v0.5에서 프로젝트/TASK/스크럼/견적 데이터가 축적되면,
이를 분석하여 **팀 퍼포먼스 인사이트**를 제공하고,
**뉴스 큐레이션**과 **아카이빙**으로 일상 업무를 지원한다.

---

## 1) 범위 (3개 모듈)

### 퍼포먼스

| 기능 | 설명 | 데이터 소스 |
|---|---|---|
| **개인 작업 현황** | 할당/완료/지연 건수, 평균 처리시간, 재오픈율 | tasks |
| **팀 작업 현황** | 팀 전체 완료율, 주간/월간 추이 | tasks |
| **프로젝트 현황** | 프로젝트별 진행률, 마일스톤 달성율 | projects, project_milestones |
| **워크로드 분석** | 팀원별 업무 부하, 과부하 감지, 재배치 제안 | tasks |
| **달성률 리포트** | 스크럼 계획 대비 실제 달성률 | daily_scrums, tasks |

> **공개 범위: 전체 공개** (기획서 확정 사항)
> 프로젝트 진행률(가중치)과 업무 달성도(목표 대비)는 **분리 운영**

### 뉴스 큐레이션

| 기능 | 설명 |
|---|---|
| **카테고리** | AI / Design / Tools 3개 카테고리 |
| **수집** | RSS/API 기반 자동 수집 + AI 요약 |
| **정리** | 카테고리별 카드 뷰, 북마크, 공유 |
| **추천** | 사용자 관심사 기반 추천 (선택) |

### 아카이빙

| 기능 | 설명 |
|---|---|
| **파일 저장** | 주요 문서/파일/이미지 업로드 |
| **태그 관리** | 태그 기반 분류 + 검색 |
| **프로젝트 연결** | 프로젝트별 아카이브 자동 분류 |
| **버전 관리** | 파일 버전 히스토리 (선택) |

---

## 2) 기술 스택 추가 (예상)

| 영역 | 패키지/서비스 | 용도 |
|---|---|---|
| 차트 | `recharts` (기존) | 퍼포먼스 차트 |
| RSS 파싱 | `rss-parser` | 뉴스 수집 |
| AI 요약 | Gemini (기존) | 뉴스 요약 생성 |
| 파일 저장 | Supabase Storage | 아카이브 파일 업로드 |

---

## 3) DB 스키마 (예상)

**performance_snapshots 테이블 (신규)** — 주간/월간 스냅샷

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users |
| `period_type` | enum | `weekly` / `monthly` |
| `period_start` | date | 기간 시작 |
| `period_end` | date | 기간 끝 |
| `tasks_assigned` | integer | 할당 건수 |
| `tasks_completed` | integer | 완료 건수 |
| `tasks_delayed` | integer | 지연 건수 |
| `avg_completion_hours` | float | 평균 처리시간 |
| `scrum_completion_rate` | float | 스크럼 달성률 |
| `created_at` | timestamptz | 스냅샷 시점 |

**news_articles 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `category` | enum | `ai` / `design` / `tools` |
| `title` | text | 기사 제목 |
| `summary` | text | AI 요약 |
| `source_url` | text | 원본 URL |
| `source_name` | text | 출처명 |
| `thumbnail_url` | text | 썸네일 |
| `published_at` | timestamptz | 발행 시점 |
| `created_at` | timestamptz | 수집 시점 |

**news_bookmarks 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users |
| `article_id` | uuid | FK → news_articles |
| `created_at` | timestamptz | 북마크 시점 |

**archives 테이블 (신규)**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK → projects (nullable) |
| `title` | text | 파일/문서명 |
| `description` | text | 설명 |
| `file_url` | text | Supabase Storage URL |
| `file_type` | text | MIME type |
| `file_size` | bigint | 파일 크기 (bytes) |
| `tags` | text[] | 태그 배열 |
| `uploaded_by` | uuid | FK → users |
| `version` | integer | 버전 번호 |
| `created_at` | timestamptz | 업로드 시점 |

---

## 4) 페이지 구성 (예상)

```
/performance                        # 퍼포먼스 메인
/performance/personal               # 개인 현황
/performance/team                   # 팀 현황
/performance/workload               # 워크로드 분석

/news                               # 뉴스 큐레이션 메인
/news?category=ai                   # 카테고리 필터
/news/bookmarks                     # 북마크 목록

/archives                           # 아카이브 메인
/archives?project=[id]              # 프로젝트별 필터
/archives/upload                    # 파일 업로드
```

---

## 5) 의존성

- **퍼포먼스**: v0.3 tasks + daily_scrums 데이터 필수
- **뉴스 큐레이션**: 독립적 (병렬 개발 가능)
- **아카이빙**: v0.3 projects 연결, Supabase Storage 필요

---

## 6) 완료 기준 (초안)

- [ ] 퍼포먼스 — 개인/팀 작업 현황 대시보드
- [ ] 퍼포먼스 — 워크로드 분석 + 과부하 감지
- [ ] 퍼포먼스 — 스크럼 달성률 리포트
- [ ] 뉴스 큐레이션 — 3카테고리 자동 수집 + AI 요약
- [ ] 뉴스 큐레이션 — 북마크 + 카드 뷰
- [ ] 아카이빙 — 파일 업로드 + 태그 관리
- [ ] 아카이빙 — 프로젝트별 자동 분류
- [ ] 라이트/다크 × 모바일/데스크톱 4조합 정상

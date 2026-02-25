# Brief: GRIFF-Q 0.1 사내 업무 관리 시스템

> Asana/Slack/Google Sheets로 분산된 업무를 하나의 내부 웹 시스템으로 통합하는 사내 도구

## Requirements
- [ ] 1. 이메일+비밀번호 로그인, 4단계 권한(super/boss/manager/normal) 기반 접근 제어
- [ ] 2. 회고 시스템(G): KPT+SSC 개인 입력 폼 + 7명 취합 뷰, 역할별/주제별 묶기
- [ ] 3. 대시보드(D): 마감일, 요청 건수, 최근 변경 로그 등 전체 현황 요약
- [ ] 4. 회의록 관리(C): 직관적 표 + 액션아이템/마감일 입력 폼. Google Sheets 복붙 파싱 입력 + Sheets 퍼블리시 기능
- [ ] 5. 견적서 공동 작업(E): 순차 편집+잠금 방식 공동 작업. PDF/Google Sheets/Excel 퍼블리시. 작년 견적 비교 + 하이라이트 (실시간 동시 편집은 v0.2)
- [ ] 6. 입금/결제 요청(B): 이름/금액/은행/계좌번호/입금자명/마감일/비고 입력 폼 + 은행명 중심 리스트 뷰
- [ ] 7. 클라이언트 반응 예측(F): 수동 프리셋 페르소나/톤 설정 + Gemini API 연동 채팅 UI (대화 데이터 학습 시스템은 v0.2)
- [ ] 8. 변경 이력: 주요 테이블에 audit log 트리거, 작업자별 수정 로그, 관리자 조회 (롤백은 v0.2)
- [ ] 9. 백업: pg_dump 정기 백업 + 클라우드 스토리지 연동

## Constraints
- 기술 스택: Next.js + Supabase (PostgreSQL) + shadcn/ui + Tailwind CSS
- 배포: 개발/QA는 Vercel Preview, 프로덕션은 Vultr 서버 (Docker Compose)
- 팀원 수: 7명 (본인 포함)
- 개발 순서: 로그인/권한 → G(회고) → D(대시보드) → C(회의록) + B(입금) 병렬 → E(견적서) + F(예측) 병렬 → 설정

## Non-goals
- 실시간 입력 폼 (회고 시스템은 비동기 작성)
- 정량 평가 시스템
- 프로젝트 관리 도구 직접 연동
- v0.1 범위 외: 실시간 동시 편집(견적서), 대화 데이터 학습(아바타), 감사 로그 롤백, 백업 자동화

## Style
- UI 컴포넌트: shadcn/ui (https://ui.shadcn.com/) 기반
- 실무적이고 간결한 톤
- 작성자가 부담 없이 채울 수 있는 폼 분량

## Key Concepts
- **KPT**: Keep / Problem / Try — 회고 프레임워크
- **SSC**: Start / Stop / Continue — 회고 프레임워크 (KPT와 혼합 사용)
- **권한 4종**: super > boss > manager > normal
- **페르소나**: 클라이언트별 성향/말투 프리셋 (반응 예측에 사용)
- **퍼블리시**: 시스템 내 데이터를 PDF/Google Sheets/Excel로 내보내기

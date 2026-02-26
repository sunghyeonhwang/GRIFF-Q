import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RetrospectiveGuidePage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">회고 사용가이드</h1>
        <p className="text-muted-foreground">
          스프린트 회고와 포스트모템 작성 방법을 안내합니다.
        </p>
      </div>

      {/* 스프린트 회고 가이드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>스프린트 회고</CardTitle>
            <Badge variant="secondary">Sprint</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>
            스프린트 회고는 프로젝트 단위로 팀원 각자가 작성하며,
            <strong> 만족도 평가</strong>, <strong>파트별 점수 평가</strong>,
            <strong> KPT</strong>, <strong>SSC</strong>, <strong>종합 의견</strong>으로 구성됩니다.
          </p>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h3 className="font-semibold">작성 순서</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>좌측 메뉴에서 <strong className="text-foreground">회고 &gt; 스프린트</strong>로 이동</li>
              <li><strong className="text-foreground">회고 작성</strong> 버튼 클릭</li>
              <li>프로젝트 선택 후 본인의 역할을 선택</li>
              <li><strong className="text-foreground">프로젝트 만족도</strong> — 6항목 1~5점 평가</li>
              <li><strong className="text-foreground">파트별 평가</strong> — 11개 파트에 점수 + 의견 작성</li>
              <li><strong className="text-foreground">KPT / SSC</strong> — 텍스트 기반 프레임워크 작성</li>
              <li><strong className="text-foreground">종합 의견</strong> — 잘한 점, 아쉬운 점, 개선사항, 팀원에게 하고 싶은 말</li>
              <li>임시저장 또는 제출완료 선택</li>
            </ol>
          </div>

          {/* 만족도 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">프로젝트 전체 만족도 (1~5점)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
              <div><strong className="text-foreground">클라이언트 만족도</strong> — 고객 만족 수준</div>
              <div><strong className="text-foreground">내부 팀 만족도</strong> — 팀 내부 만족 수준</div>
              <div><strong className="text-foreground">일정 준수율</strong> — 일정 내 완료 여부</div>
              <div><strong className="text-foreground">예산 준수율</strong> — 예산 내 집행 여부</div>
              <div><strong className="text-foreground">결과물 품질</strong> — 산출물의 완성도</div>
              <div><strong className="text-foreground">커뮤니케이션 원활도</strong> — 소통 수준</div>
            </div>
          </div>

          {/* 파트별 평가 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">파트별 평가 (11개 파트)</h3>
            <p className="text-muted-foreground mb-2">
              각 파트에 대해 <strong className="text-foreground">점수(1~5)</strong>,
              <strong className="text-foreground"> 잘한 점</strong>,
              <strong className="text-foreground"> 아쉬운 점</strong>,
              <strong className="text-foreground"> 점수 근거</strong>,
              <strong className="text-foreground"> 개선안</strong>을 작성합니다.
              평가할 파트만 작성하면 됩니다.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "기획 (컨텐츠)", "기획 (일정)", "메인 디자인",
                "서브 디자인 (출력물 등)", "현장 답사", "커뮤니케이션",
                "웹사이트 디자인", "현장 진행", "영상", "중계", "기타",
              ].map((part) => (
                <Badge key={part} variant="outline" className="text-xs">
                  {part}
                </Badge>
              ))}
            </div>
          </div>

          {/* 점수 기준 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">점수 기준</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-sm">
              <div className="rounded bg-red-100 dark:bg-red-950 p-2">
                <div className="font-bold">1점</div>
                <div className="text-muted-foreground text-xs">매우 미흡</div>
              </div>
              <div className="rounded bg-orange-100 dark:bg-orange-950 p-2">
                <div className="font-bold">2점</div>
                <div className="text-muted-foreground text-xs">미흡</div>
              </div>
              <div className="rounded bg-yellow-100 dark:bg-yellow-950 p-2">
                <div className="font-bold">3점</div>
                <div className="text-muted-foreground text-xs">보통</div>
              </div>
              <div className="rounded bg-green-100 dark:bg-green-950 p-2">
                <div className="font-bold">4점</div>
                <div className="text-muted-foreground text-xs">우수</div>
              </div>
              <div className="rounded bg-blue-100 dark:bg-blue-950 p-2">
                <div className="font-bold">5점</div>
                <div className="text-muted-foreground text-xs">매우 우수</div>
              </div>
            </div>
          </div>

          {/* KPT / SSC */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">KPT 프레임워크</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Keep</strong> — 잘한 점, 계속 유지할 것</li>
                <li><strong className="text-foreground">Problem</strong> — 문제점, 개선이 필요한 것</li>
                <li><strong className="text-foreground">Try</strong> — 다음에 시도해볼 것</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">SSC 프레임워크</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Stop</strong> — 그만할 것</li>
                <li><strong className="text-foreground">Start</strong> — 새로 시작할 것</li>
                <li><strong className="text-foreground">Continue</strong> — 계속할 것</li>
              </ul>
            </div>
          </div>

          {/* 종합 의견 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">종합 의견</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">가장 잘한 점</strong> — 팀이 가장 잘 해낸 부분</li>
              <li><strong className="text-foreground">가장 아쉬운 점</strong> — 가장 아쉬웠던 부분</li>
              <li><strong className="text-foreground">반드시 개선할 사항</strong> — 다음에 꼭 고쳐야 할 것</li>
              <li><strong className="text-foreground">팀원에게 전하고 싶은 말</strong> — 자유 메시지</li>
            </ul>
          </div>

          {/* 취합 뷰 */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h3 className="font-semibold">취합 뷰 (종합 페이지)</h3>
            <p className="text-muted-foreground">
              프로젝트별 <strong className="text-foreground">취합 뷰</strong>에서는
              팀 전체의 만족도 평균, 파트별 점수 집계, KPT/SSC 인사이트,
              종합 교훈을 한눈에 확인할 수 있습니다.
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">만족도 현황</strong> — 6항목 팀 평균 + 팀원별 비교</li>
              <li><strong className="text-foreground">파트별 분석</strong> — 11개 파트 평균 + 최고/최저 파트 + 상세 의견</li>
              <li><strong className="text-foreground">KPT + SSC</strong> — 전체 인사이트 통합</li>
              <li><strong className="text-foreground">종합 교훈</strong> — 잘한 점/아쉬운 점/개선안 + 역할별 요약</li>
            </ul>
          </div>

          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-4 space-y-1">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">핵심 원칙</h3>
            <p className="text-muted-foreground">
              포스트모템은 <strong className="text-foreground">&apos;사람&apos;이 아닌 &apos;프로세스와 시스템&apos;</strong>에 초점을 맞춥니다.
              비난이 아닌 개선을 목표로 작성해주세요.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 포스트모템 가이드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>포스트모템</CardTitle>
            <Badge variant="destructive">Postmortem</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>
            포스트모템은 프로젝트에서 발생한 장애나 중요 이슈에 대해 원인 분석과
            재발 방지 대책을 기록합니다.
          </p>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold">포스트모템 항목</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">제목</strong> — 이슈를 간결하게 설명</li>
              <li><strong className="text-foreground">심각도</strong> — Low / Medium / High / Critical</li>
              <li><strong className="text-foreground">발생일</strong> — 이슈가 발생한 날짜</li>
              <li><strong className="text-foreground">타임라인</strong> — 발생부터 해결까지의 과정</li>
              <li><strong className="text-foreground">근본 원인</strong> — 문제의 근본적인 원인 분석</li>
              <li><strong className="text-foreground">액션 아이템</strong> — 재발 방지를 위한 조치</li>
              <li><strong className="text-foreground">교훈</strong> — 이 사건에서 배운 점</li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h3 className="font-semibold">작성 순서</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">프로젝트 상세</strong> 페이지로 이동</li>
              <li>포스트모템 탭에서 <strong className="text-foreground">포스트모템 작성</strong> 버튼 클릭</li>
              <li>위 항목들을 빠짐없이 기록</li>
              <li>작성 완료 후 <strong className="text-foreground">회고 &gt; 포스트모템</strong> 목록에서 전체 조회 가능</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

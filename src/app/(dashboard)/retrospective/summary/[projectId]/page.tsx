import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  SATISFACTION_ITEMS,
  EVALUATION_PARTS,
  SCORE_LABELS,
  type PartEvaluation,
} from "@/lib/retrospective-constants";

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color =
    score >= 4 ? "bg-green-500" : score >= 3 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-secondary">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8">{score.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">
        {score >= 4 ? "우수" : score >= 3 ? "보통" : "개선 필요"}
      </span>
    </div>
  );
}

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireAuth();
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const { data: retrospectives } = await supabase
    .from("retrospectives")
    .select("*, users!retrospectives_author_id_fkey(name)")
    .eq("project_id", projectId)
    .order("created_at");

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const retros = retrospectives ?? [];
  const users = allUsers ?? [];
  const submittedRetros = retros.filter((r) => r.status === "submitted");
  const submittedCount = submittedRetros.length;

  // ── 만족도 집계 ──
  const satAggregates: Record<string, number[]> = {};
  for (const item of SATISFACTION_ITEMS) {
    satAggregates[item.key] = [];
  }
  for (const retro of submittedRetros) {
    const scores = (retro.satisfaction_scores ?? {}) as Record<string, number>;
    for (const item of SATISFACTION_ITEMS) {
      if (scores[item.key] && scores[item.key] > 0) {
        satAggregates[item.key].push(scores[item.key]);
      }
    }
  }
  const satAverages = SATISFACTION_ITEMS.map((item) => {
    const vals = satAggregates[item.key];
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { ...item, avg, count: vals.length };
  });
  const overallSatAvg =
    satAverages.filter((s) => s.avg > 0).length > 0
      ? satAverages.filter((s) => s.avg > 0).reduce((a, b) => a + b.avg, 0) /
        satAverages.filter((s) => s.avg > 0).length
      : 0;

  // ── 파트별 점수 집계 ──
  const partAggregates: Record<string, { scores: number[]; evals: { author: string; eval: PartEvaluation }[] }> = {};
  for (const part of EVALUATION_PARTS) {
    partAggregates[part] = { scores: [], evals: [] };
  }
  for (const retro of submittedRetros) {
    const evals = (retro.part_evaluations ?? []) as PartEvaluation[];
    const authorName = (retro as any).users?.name ?? "?";
    for (const pe of evals) {
      if (pe.score > 0 && partAggregates[pe.part]) {
        partAggregates[pe.part].scores.push(pe.score);
        partAggregates[pe.part].evals.push({ author: authorName, eval: pe });
      }
    }
  }
  const partAverages = EVALUATION_PARTS.map((part) => {
    const data = partAggregates[part];
    const avg =
      data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0;
    return { part, avg, count: data.scores.length, evals: data.evals };
  }).filter((p) => p.count > 0);

  const overallPartAvg =
    partAverages.length > 0
      ? partAverages.reduce((a, b) => a + b.avg, 0) / partAverages.length
      : 0;

  const bestPart = partAverages.length > 0
    ? partAverages.reduce((a, b) => (a.avg >= b.avg ? a : b))
    : null;
  const worstPart = partAverages.length > 0
    ? partAverages.reduce((a, b) => (a.avg <= b.avg ? a : b))
    : null;

  // ── 팀원별 평균 점수 ──
  const memberScores = submittedRetros.map((retro) => {
    const evals = (retro.part_evaluations ?? []) as PartEvaluation[];
    const scored = evals.filter((e) => e.score > 0);
    const avg = scored.length > 0
      ? scored.reduce((a, b) => a + b.score, 0) / scored.length
      : 0;
    const satScores = retro.satisfaction_scores as Record<string, number> | null;
    const satVals = satScores
      ? Object.values(satScores).filter((v) => v > 0)
      : [];
    const satAvg = satVals.length > 0
      ? satVals.reduce((a, b) => a + b, 0) / satVals.length
      : 0;
    return {
      name: (retro as any).users?.name ?? "?",
      partAvg: avg,
      satAvg,
      partCount: scored.length,
    };
  });

  // ── KPT/SSC 집계 (기존) ──
  const allKeep = retros.flatMap((r) => (r.keep as string[]).filter(Boolean));
  const allContinue = retros.flatMap((r) => (r.continue_items as string[]).filter(Boolean));
  const allProblem = retros.flatMap((r) => (r.problem as string[]).filter(Boolean));
  const allStop = retros.flatMap((r) => (r.stop as string[]).filter(Boolean));
  const allTry = retros.flatMap((r) => (r.try as string[]).filter(Boolean));
  const allStart = retros.flatMap((r) => (r.start_items as string[]).filter(Boolean));

  // ── 역할별 요약 ──
  const roleMap = new Map<string, { issues: string[]; actions: string[] }>();
  for (const retro of retros) {
    const roles = retro.roles as string[];
    const issues = [...(retro.problem as string[]), ...(retro.stop as string[])].filter(Boolean);
    const actions = [...(retro.try as string[]), ...(retro.start_items as string[])].filter(Boolean);
    for (const role of roles) {
      if (!roleMap.has(role)) roleMap.set(role, { issues: [], actions: [] });
      const entry = roleMap.get(role)!;
      entry.issues.push(...issues);
      entry.actions.push(...actions);
    }
  }

  // ── 종합 의견 수집 ──
  const allBest = submittedRetros
    .map((r) => ({ author: (r as any).users?.name ?? "?", text: r.overall_best as string }))
    .filter((x) => x.text);
  const allWorst = submittedRetros
    .map((r) => ({ author: (r as any).users?.name ?? "?", text: r.overall_worst as string }))
    .filter((x) => x.text);
  const allImprovement = submittedRetros
    .map((r) => ({ author: (r as any).users?.name ?? "?", text: r.overall_improvement as string }))
    .filter((x) => x.text);
  const allMessage = submittedRetros
    .map((r) => ({ author: (r as any).users?.name ?? "?", text: r.overall_message as string }))
    .filter((x) => x.text);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name} — 회고 종합</h1>
        <p className="text-muted-foreground">
          제출: {submittedCount} / {users.length}명
        </p>
      </div>

      <Tabs defaultValue="scores">
        <TabsList className="flex-wrap">
          <TabsTrigger value="scores">만족도 현황</TabsTrigger>
          <TabsTrigger value="parts">파트별 분석</TabsTrigger>
          <TabsTrigger value="insights">KPT + SSC</TabsTrigger>
          <TabsTrigger value="lessons">종합 교훈</TabsTrigger>
          <TabsTrigger value="overview">참여 현황</TabsTrigger>
        </TabsList>

        {/* ===== 탭 1: 만족도 현황 ===== */}
        <TabsContent value="scores" className="space-y-6">
          {/* 전체 평균 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">만족도 전체 평균</p>
                <p className="text-4xl font-bold mt-1">
                  {overallSatAvg > 0 ? overallSatAvg.toFixed(1) : "-"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">파트별 전체 평균</p>
                <p className="text-4xl font-bold mt-1">
                  {overallPartAvg > 0 ? overallPartAvg.toFixed(1) : "-"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">제출 인원</p>
                <p className="text-4xl font-bold mt-1">
                  {submittedCount}<span className="text-lg text-muted-foreground">/{users.length}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">명</p>
              </CardContent>
            </Card>
          </div>

          {/* 6개 만족도 항목 */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 만족도 (팀 평균)</CardTitle>
              <CardDescription>{submittedCount}명의 평가 기반</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {satAverages.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-40">{item.label}</span>
                    {item.avg > 0 ? (
                      <ScoreBar score={item.avg} />
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 팀원별 평균 비교 */}
          {memberScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>팀원별 평균 점수</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>팀원</TableHead>
                      <TableHead>만족도 평균</TableHead>
                      <TableHead>파트별 평균</TableHead>
                      <TableHead>평가 파트 수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberScores.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          {m.satAvg > 0 ? <ScoreBar score={m.satAvg} /> : "-"}
                        </TableCell>
                        <TableCell>
                          {m.partAvg > 0 ? <ScoreBar score={m.partAvg} /> : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.partCount}개
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== 탭 2: 파트별 분석 ===== */}
        <TabsContent value="parts" className="space-y-6">
          {/* 최고/최저 파트 */}
          {bestPart && worstPart && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-green-200 dark:border-green-900">
                <CardContent className="pt-6 flex items-center gap-3">
                  <TrendingUp className="size-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">최고 파트</p>
                    <p className="font-semibold">{bestPart.part}</p>
                  </div>
                  <Badge className="ml-auto text-base px-3 py-1">{bestPart.avg.toFixed(1)}점</Badge>
                </CardContent>
              </Card>
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="pt-6 flex items-center gap-3">
                  <TrendingDown className="size-5 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">최저 파트</p>
                    <p className="font-semibold">{worstPart.part}</p>
                  </div>
                  <Badge variant="destructive" className="ml-auto text-base px-3 py-1">{worstPart.avg.toFixed(1)}점</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 파트별 평균 점수 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle>파트별 평균 점수</CardTitle>
              <CardDescription>제출된 평가를 파트별로 집계합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {partAverages.length > 0 ? (
                <div className="space-y-3">
                  {partAverages.map((p, idx) => (
                    <div key={p.part}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <span className="text-muted-foreground w-5">{idx + 1}.</span>
                          {p.part}
                          <span className="text-xs text-muted-foreground">({p.count}명)</span>
                        </span>
                        <ScoreBar score={p.avg} />
                      </div>
                      {/* 개별 평가 펼치기 */}
                      {p.evals.length > 0 && (
                        <details className="ml-7 mb-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            팀원별 상세 보기
                          </summary>
                          <div className="mt-2 space-y-2">
                            {p.evals.map((e, ei) => (
                              <div key={ei} className="rounded-lg border p-3 text-sm space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{e.author}</span>
                                  <Badge
                                    variant={e.eval.score >= 4 ? "default" : e.eval.score >= 3 ? "secondary" : "destructive"}
                                  >
                                    {e.eval.score}점
                                  </Badge>
                                </div>
                                {e.eval.good && (
                                  <p className="text-muted-foreground">
                                    <span className="text-green-600 font-medium">잘한 점: </span>
                                    {e.eval.good}
                                  </p>
                                )}
                                {e.eval.bad && (
                                  <p className="text-muted-foreground">
                                    <span className="text-red-600 font-medium">아쉬운 점: </span>
                                    {e.eval.bad}
                                  </p>
                                )}
                                {e.eval.improvement && (
                                  <p className="text-muted-foreground">
                                    <span className="text-blue-600 font-medium">개선안: </span>
                                    {e.eval.improvement}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  아직 파트별 평가 데이터가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 탭 3: KPT + SSC (기존) ===== */}
        <TabsContent value="insights" className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">KPT</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-700 dark:text-green-400">
                    Keep (유지할 것)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {allKeep.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {allKeep.length === 0 && (
                      <li className="text-muted-foreground">아직 데이터 없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-700 dark:text-red-400">
                    Problem (문제점)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {allProblem.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {allProblem.length === 0 && (
                      <li className="text-muted-foreground">아직 데이터 없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-blue-700 dark:text-blue-400">
                    Try (시도할 것)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {allTry.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {allTry.length === 0 && (
                      <li className="text-muted-foreground">아직 데이터 없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">SSC</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-blue-700 dark:text-blue-400">
                    Start (시작할 것)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {allStart.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {allStart.length === 0 && (
                      <li className="text-muted-foreground">아직 데이터 없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-700 dark:text-red-400">
                    Stop (중단할 것)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {allStop.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {allStop.length === 0 && (
                      <li className="text-muted-foreground">아직 데이터 없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-700 dark:text-green-400">
                    Continue (계속할 것)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {allContinue.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {allContinue.length === 0 && (
                      <li className="text-muted-foreground">아직 데이터 없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== 탭 4: 종합 교훈 & 제언 ===== */}
        <TabsContent value="lessons" className="space-y-6">
          {/* 가장 잘한 점 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700 dark:text-green-400 flex items-center gap-2">
                <TrendingUp className="size-4" />
                이번 프로젝트에서 가장 잘한 점
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allBest.length > 0 ? (
                <div className="space-y-2">
                  {allBest.map((item, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium text-muted-foreground">{item.author}:</span>{" "}
                      {item.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">아직 데이터 없음</p>
              )}
            </CardContent>
          </Card>

          {/* 가장 아쉬운 점 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2">
                <TrendingDown className="size-4" />
                이번 프로젝트에서 가장 아쉬운 점
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allWorst.length > 0 ? (
                <div className="space-y-2">
                  {allWorst.map((item, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium text-muted-foreground">{item.author}:</span>{" "}
                      {item.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">아직 데이터 없음</p>
              )}
            </CardContent>
          </Card>

          {/* 반드시 개선할 사항 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Minus className="size-4" />
                반드시 개선할 사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allImprovement.length > 0 ? (
                <div className="space-y-2">
                  {allImprovement.map((item, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium text-muted-foreground">{item.author}:</span>{" "}
                      {item.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">아직 데이터 없음</p>
              )}
            </CardContent>
          </Card>

          {/* 팀원에게 전하고 싶은 말 */}
          {allMessage.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">팀원들에게 전하고 싶은 말</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allMessage.map((item, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium text-muted-foreground">{item.author}:</span>{" "}
                      {item.text}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 역할별 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>역할별 이슈 & 액션</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>역할</TableHead>
                    <TableHead>핵심 이슈</TableHead>
                    <TableHead>다음 액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleMap.size === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        아직 데이터 없음
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.from(roleMap.entries()).map(([role, data]) => (
                      <TableRow key={role}>
                        <TableCell className="font-medium align-top">{role}</TableCell>
                        <TableCell className="align-top">
                          <ul className="list-disc pl-4 text-sm space-y-0.5">
                            {data.issues.slice(0, 5).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell className="align-top">
                          <ul className="list-disc pl-4 text-sm space-y-0.5">
                            {data.actions.slice(0, 5).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 탭 5: 참여 현황 ===== */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>참여 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>제출 여부</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const retro = retros.find((r) => r.author_id === u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {retro ? (
                              (retro.roles as string[]).map((r) => (
                                <Badge key={r} variant="secondary" className="text-xs">
                                  {r}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {retro?.status === "submitted" ? (
                            <Check className="size-4 text-green-600" />
                          ) : retro?.status === "draft" ? (
                            <Badge variant="outline">작성중</Badge>
                          ) : (
                            <X className="size-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

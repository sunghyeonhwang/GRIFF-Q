import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";

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

  // 통합 인사이트 집계
  const allKeep = retros.flatMap((r) => (r.keep as string[]).filter(Boolean));
  const allContinue = retros.flatMap((r) => (r.continue_items as string[]).filter(Boolean));
  const allProblem = retros.flatMap((r) => (r.problem as string[]).filter(Boolean));
  const allStop = retros.flatMap((r) => (r.stop as string[]).filter(Boolean));
  const allTry = retros.flatMap((r) => (r.try as string[]).filter(Boolean));
  const allStart = retros.flatMap((r) => (r.start_items as string[]).filter(Boolean));

  // 역할별 요약
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

  const submittedCount = retros.filter((r) => r.status === "submitted").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name} — 회고 취합</h1>
        <p className="text-muted-foreground">
          제출: {submittedCount} / {users.length}명
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">참여 현황</TabsTrigger>
          <TabsTrigger value="insights">통합 인사이트</TabsTrigger>
          <TabsTrigger value="roles">역할별 요약</TabsTrigger>
        </TabsList>

        {/* 참여 현황 */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>역할별 참여 현황</CardTitle>
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

        {/* 통합 인사이트 */}
        <TabsContent value="insights">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">
                  Keep / Continue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {[...allKeep, ...allContinue].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {allKeep.length + allContinue.length === 0 && (
                    <li className="text-muted-foreground">아직 데이터 없음</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Problem / Stop</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {[...allProblem, ...allStop].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {allProblem.length + allStop.length === 0 && (
                    <li className="text-muted-foreground">아직 데이터 없음</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Try / Start</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {[...allTry, ...allStart].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {allTry.length + allStart.length === 0 && (
                    <li className="text-muted-foreground">아직 데이터 없음</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 역할별 요약 */}
        <TabsContent value="roles">
          <Card>
            <CardContent className="pt-6">
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
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        아직 데이터 없음
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.from(roleMap.entries()).map(([role, data]) => (
                      <TableRow key={role}>
                        <TableCell className="font-medium align-top">
                          {role}
                        </TableCell>
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
      </Tabs>
    </div>
  );
}

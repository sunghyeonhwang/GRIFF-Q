import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Users, BarChart3 } from "lucide-react";

export default async function RetrospectivePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: retrospectives } = await supabase
    .from("retrospectives")
    .select("*, projects(name), users!retrospectives_author_id_fkey(name)")
    .order("created_at", { ascending: false });

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  const { data: allUsers } = await supabase
    .from("users")
    .select("id")
    .eq("is_active", true);

  const totalUsers = allUsers?.length ?? 0;
  const retros = retrospectives ?? [];

  // 내 회고
  const myRetros = retros.filter((r) => r.author_id === user.id);

  // 프로젝트별 그룹핑
  const projectMap = new Map<
    string,
    {
      id: string;
      name: string;
      retros: typeof retros;
      submittedCount: number;
      draftCount: number;
    }
  >();

  for (const p of projects ?? []) {
    projectMap.set(p.id, {
      id: p.id,
      name: p.name,
      retros: [],
      submittedCount: 0,
      draftCount: 0,
    });
  }

  for (const retro of retros) {
    const entry = projectMap.get(retro.project_id);
    if (entry) {
      entry.retros.push(retro);
      if (retro.status === "submitted") entry.submittedCount++;
      else entry.draftCount++;
    }
  }

  const projectList = Array.from(projectMap.values());

  function renderRetroRow(retro: (typeof retros)[number], showProject = false) {
    return (
      <TableRow key={retro.id}>
        {showProject && (
          <TableCell className="font-medium">
            {(retro as any).projects?.name ?? "-"}
          </TableCell>
        )}
        <TableCell className="font-medium">
          <Link
            href={`/retrospective/${retro.id}`}
            className="hover:underline"
          >
            {(retro as any).users?.name ?? "-"}
          </Link>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {(retro.roles as string[])?.map((r: string) => (
              <Badge key={r} variant="secondary" className="text-xs">
                {r}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant={retro.status === "submitted" ? "default" : "outline"}
          >
            {retro.status === "submitted" ? "제출완료" : "임시저장"}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {new Date(retro.created_at).toLocaleDateString("ko-KR")}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">스프린트 회고</h1>
          <p className="text-muted-foreground">
            프로젝트별 KPT + SSC 스프린트 회고를 작성하고 취합합니다.
          </p>
        </div>
        <Link href="/retrospective/new">
          <Button>
            <Plus className="mr-2 size-4" />
            회고 작성
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="project">
        <TabsList>
          <TabsTrigger value="mine">
            내 회고
            {myRetros.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {myRetros.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="project">
            프로젝트별
            {projectList.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {projectList.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 내 회고 탭 */}
        <TabsContent value="mine" className="space-y-4">
          {myRetros.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로젝트</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작성일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRetros.map((retro) => renderRetroRow(retro, true))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                아직 작성한 회고가 없습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 프로젝트별 탭 */}
        <TabsContent value="project" className="space-y-6">
          {/* 프로젝트 요약 카드 */}
          {projectList.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectList.map((p) => {
                const pct =
                  totalUsers > 0
                    ? Math.round((p.submittedCount / totalUsers) * 100)
                    : 0;
                return (
                  <Card key={p.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <Link href={`/retrospective/summary/${p.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            <BarChart3 className="mr-1 size-3" />
                            취합 뷰
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="size-3" />
                          제출 현황
                        </span>
                        <span className="font-medium">
                          {p.submittedCount}/{totalUsers}명
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {p.draftCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          임시저장 {p.draftCount}건
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* 프로젝트별 Accordion */}
          {projectList.length > 0 ? (
            <Accordion
              type="multiple"
              defaultValue={projectList.map((p) => p.id)}
            >
              {projectList.map((p) => (
                <AccordionItem key={p.id} value={p.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{p.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {p.retros.length}건
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {p.retros.length > 0 ? (
                      <div className="rounded-lg border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>작성자</TableHead>
                              <TableHead>역할</TableHead>
                              <TableHead>상태</TableHead>
                              <TableHead>작성일</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {p.retros.map((retro) => renderRetroRow(retro))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        아직 작성된 회고가 없습니다.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                아직 등록된 프로젝트가 없습니다. 회고 작성 시 프로젝트를 생성할
                수 있습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

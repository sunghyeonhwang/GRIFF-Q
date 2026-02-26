"use client";

import Link from "next/link";
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
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_VARIANTS,
} from "@/lib/estimate-constants";

interface ProjectHubTabsProps {
  project: {
    id: string;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    description: string;
    lead_user_name: string | null;
  };
  estimates: any[];
  meetings: any[];
  retrospectives: any[];
  payments: any[];
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "진행 중",
  completed: "완료",
  on_hold: "보류",
};

const PROJECT_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  completed: "secondary",
  on_hold: "outline",
};

export function ProjectHubTabs({
  project,
  estimates,
  meetings,
  retrospectives,
  payments,
}: ProjectHubTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="estimates">견적서 ({estimates.length})</TabsTrigger>
        <TabsTrigger value="meetings">회의록 ({meetings.length})</TabsTrigger>
        <TabsTrigger value="retros">회고 ({retrospectives.length})</TabsTrigger>
        <TabsTrigger value="payments">입금 ({payments.length})</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">상태</dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      PROJECT_STATUS_VARIANTS[project.status] ?? "outline"
                    }
                  >
                    {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">담당자</dt>
                <dd className="font-medium mt-1">
                  {project.lead_user_name ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">시작일</dt>
                <dd className="font-medium mt-1">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString("ko-KR")
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">종료일</dt>
                <dd className="font-medium mt-1">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString("ko-KR")
                    : "-"}
                </dd>
              </div>
            </dl>
            {project.description && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">설명</p>
                <p className="text-sm whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                견적서
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estimates.length}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                회의록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{meetings.length}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                회고
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{retrospectives.length}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                입금
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{payments.length}건</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent activities timeline */}
        {meetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meetings.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-start gap-3">
                    <div className="size-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <Link
                        href={`/meetings/${m.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {m.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Estimates Tab */}
      <TabsContent value="estimates">
        {estimates.length > 0 ? (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로젝트명</TableHead>
                    <TableHead>클라이언트</TableHead>
                    <TableHead>견적일</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/estimates/${e.id}`}
                          className="hover:underline"
                        >
                          {e.project_name}
                        </Link>
                      </TableCell>
                      <TableCell>{e.client_name}</TableCell>
                      <TableCell className="text-sm">
                        {e.estimate_date
                          ? new Date(e.estimate_date).toLocaleDateString(
                              "ko-KR"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ESTIMATE_STATUS_VARIANTS[e.status] ?? "outline"
                          }
                        >
                          {ESTIMATE_STATUS_LABELS[e.status] ?? e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              연결된 견적서가 없습니다.
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Meetings Tab */}
      <TabsContent value="meetings">
        {meetings.length > 0 ? (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>작성자</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/meetings/${m.id}`}
                          className="hover:underline"
                        >
                          {m.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(m as any).users?.name ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              연결된 회의록이 없습니다.
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Retrospectives Tab */}
      <TabsContent value="retros">
        {retrospectives.length > 0 ? (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상태</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>작성일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retrospectives.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "completed" ? "default" : "outline"
                          }
                        >
                          {r.status === "completed" ? "완료" : "작성중"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {(r as any).users?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(r.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              연결된 회고가 없습니다.
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Payments Tab */}
      <TabsContent value="payments">
        {payments.length > 0 ? (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>은행</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/payments/${p.id}`}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {Number(p.amount).toLocaleString()}원
                      </TableCell>
                      <TableCell>{p.bank}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "completed" ? "default" : "outline"
                          }
                        >
                          {p.status === "completed" ? "완료" : "대기"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              연결된 입금 내역이 없습니다.
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

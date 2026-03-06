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
import {
  ListChecks,
  GitBranch,
  Clock,
  Bot,
  Settings,
  ExternalLink,
} from "lucide-react";
import { ProjectProgressBar } from "./project-progress-bar";
import { ProjectMilestoneTimeline } from "./project-milestone-timeline";
import type { ProjectMember, ProjectMilestone, ProjectRole } from "@/types/project.types";

interface ProjectHubTabsProps {
  project: {
    id: string;
    name: string;
    status: string;
    project_type?: string;
    progress?: number;
    start_date: string | null;
    end_date: string | null;
    description: string;
    lead_user_name: string | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estimates: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meetings: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retrospectives: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payments: any[];
  members?: ProjectMember[];
  milestones?: ProjectMilestone[];
  taskCount?: number;
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

const PROJECT_TYPE_LABELS: Record<string, string> = {
  general: "일반 프로젝트",
  event: "행사/이벤트",
  content: "콘텐츠 제작",
  maintenance: "유지보수",
};

const ROLE_LABELS: Record<ProjectRole, string> = {
  pm: "PM",
  planner: "기획자",
  designer: "디자이너",
  developer: "개발자",
  video: "영상 담당",
  operations: "운영 담당",
  allrounder: "올라운더",
};

// 하위 페이지로의 링크 탭들
interface LinkTab {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

function getLinkTabs(projectId: string): LinkTab[] {
  return [
    {
      key: "tasks",
      label: "Task",
      icon: ListChecks,
      path: `/projects/${projectId}/tasks`,
      description: "프로젝트의 임무카드(Task) 목록과 칸반 보드를 관리합니다.",
    },
    {
      key: "dependency-map",
      label: "의존성 맵",
      icon: GitBranch,
      path: `/projects/${projectId}/dependency-map`,
      description: "Task 간의 의존성 관계를 DAG 형태로 시각화합니다.",
    },
    {
      key: "timeline",
      label: "타임라인",
      icon: Clock,
      path: `/projects/${projectId}/timeline`,
      description: "마일스톤과 Task의 일정을 타임라인으로 확인합니다.",
    },
    {
      key: "review",
      label: "AI 리뷰",
      icon: Bot,
      path: `/projects/${projectId}/review`,
      description: "AI 기반 프로젝트 분석과 대화형 리뷰를 수행합니다.",
    },
    {
      key: "settings",
      label: "설정",
      icon: Settings,
      path: `/projects/${projectId}/settings`,
      description: "프로젝트 설정, 멤버 관리, 아카이브 등을 관리합니다.",
    },
  ];
}

export function ProjectHubTabs({
  project,
  estimates,
  meetings,
  retrospectives,
  payments,
  members = [],
  milestones = [],
  taskCount = 0,
}: ProjectHubTabsProps) {
  const linkTabs = getLinkTabs(project.id);

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="estimates">견적서 ({estimates.length})</TabsTrigger>
        <TabsTrigger value="meetings">회의록 ({meetings.length})</TabsTrigger>
        <TabsTrigger value="retros">회고 ({retrospectives.length})</TabsTrigger>
        <TabsTrigger value="payments">입금 ({payments.length})</TabsTrigger>
        <TabsTrigger value="modules">모듈</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 진행률 바 */}
            {typeof project.progress === "number" && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">진행률</p>
                <ProjectProgressBar progress={project.progress} />
              </div>
            )}

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
              {project.project_type && (
                <div>
                  <dt className="text-muted-foreground">종류</dt>
                  <dd className="font-medium mt-1">
                    {PROJECT_TYPE_LABELS[project.project_type] ?? project.project_type}
                  </dd>
                </div>
              )}
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
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                임무카드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{taskCount}건</p>
            </CardContent>
          </Card>
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

        {/* 멤버 목록 */}
        {members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">팀 멤버 ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg border"
                  >
                    <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {(member.user?.name ?? "?").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {member.user?.name ?? "미배정"}
                      </p>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {ROLE_LABELS[member.role]}
                        </Badge>
                        {member.is_backup && (
                          <Badge variant="outline" className="text-xs">
                            백업
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 마일스톤 타임라인 */}
        <ProjectMilestoneTimeline
          projectId={project.id}
          milestones={milestones}
        />

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
                        {m.users?.name ?? "-"}
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
                        {r.users?.name ?? "-"}
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

      {/* Modules Tab — 하위 페이지 링크 */}
      <TabsContent value="modules" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {linkTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link key={tab.key} href={tab.path}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">{tab.label}</h3>
                          <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}

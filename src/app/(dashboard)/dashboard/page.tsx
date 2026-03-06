import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkDeadlineNotifications } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarClock,
  CreditCard,
  FileText,
  MessageSquareText,
} from "lucide-react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardScrumWidget } from "@/components/dashboard/dashboard-scrum-widget";
import { DashboardTasksWidget } from "@/components/dashboard/dashboard-tasks-widget";
import { DashboardProjectsWidget } from "@/components/dashboard/dashboard-projects-widget";
import { DashboardScheduleWidget } from "@/components/dashboard/dashboard-schedule-widget";
import dynamic from "next/dynamic";

const PaymentTrendChart = dynamic(
  () => import("@/components/dashboard/payment-trend-chart").then((m) => m.PaymentTrendChart),
  { loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-muted" /> },
);
const EstimateStatusChart = dynamic(
  () => import("@/components/dashboard/estimate-status-chart").then((m) => m.EstimateStatusChart),
  { loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-muted" /> },
);
const RetroSubmitChart = dynamic(
  () => import("@/components/dashboard/retro-submit-chart").then((m) => m.RetroSubmitChart),
  { loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-muted" /> },
);
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { CountUp } from "@/components/ui/count-up";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후에요";
  return "좋은 저녁이에요";
}

function formatToday(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return now.toLocaleDateString("ko-KR", options);
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // 마감 임박 알림 자동 생성 (3일 이내)
  checkDeadlineNotifications(supabase, user.id).catch(() => {});

  // 마감 임박 액션아이템 (7일 이내, 미완료)
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const [
    { data: upcomingActions },
    { data: pendingPayments },
    { data: recentMeetings },
    { data: projects },
    { data: retroCounts },
    { data: allUsers },
    { data: allPayments },
    { data: estimates },
    { data: auditLogs },
    { data: todayScrum },
    { data: todayTasks },
    { data: activeProjects },
    { data: todaySchedules },
  ] = await Promise.all([
    supabase
      .from("action_items")
      .select("*, meetings(title)")
      .in("status", ["pending", "in_progress"])
      .not("due_date", "is", null)
      .lte("due_date", sevenDaysLater.toISOString().split("T")[0])
      .order("due_date")
      .limit(5),
    supabase
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("meetings")
      .select("id, title, meeting_date")
      .order("meeting_date", { ascending: false })
      .limit(5),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("retrospectives").select("project_id, status"),
    supabase.from("users").select("id").eq("is_active", true),
    // B3: 월별 입금 추이 데이터
    supabase
      .from("payments")
      .select("amount, completed_at")
      .eq("status", "completed")
      .not("completed_at", "is", null),
    // B3: 견적 상태 분포
    supabase.from("estimates").select("status"),
    // B5: 최근 활동 타임라인
    supabase
      .from("audit_logs")
      .select("id, action, table_name, created_at, users!audit_logs_changed_by_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(10),
    // v0.3D: 오늘 스크럼 상태
    supabase
      .from("daily_scrums")
      .select("status, scrum_items(id)")
      .eq("user_id", user.id)
      .eq("scrum_date", new Date().toISOString().split("T")[0])
      .maybeSingle(),
    // v0.3D: 오늘 마감 태스크
    supabase
      .from("tasks")
      .select("id, title, status, priority")
      .or(`assignee_id.eq.${user.id},created_by.eq.${user.id}`)
      .eq("due_date", new Date().toISOString().split("T")[0])
      .neq("status", "completed")
      .order("priority")
      .limit(5),
    // v0.3D: 활성 프로젝트
    supabase
      .from("projects")
      .select("id, name, progress, status")
      .is("deleted_at", null)
      .in("status", ["planning", "in_progress"])
      .order("updated_at", { ascending: false })
      .limit(4),
    // v0.3D: 오늘 일정
    supabase
      .from("schedules")
      .select("id, title, start_time, end_time, category")
      .eq("schedule_date", new Date().toISOString().split("T")[0])
      .order("start_time")
      .limit(5),
  ]);

  const totalUsers = allUsers?.length ?? 0;

  // 프로젝트별 제출 수 집계
  const projectRetroMap = new Map<string, number>();
  for (const r of retroCounts ?? []) {
    if (r.status === "submitted") {
      projectRetroMap.set(
        r.project_id,
        (projectRetroMap.get(r.project_id) ?? 0) + 1
      );
    }
  }

  // 요약 수치
  const upcomingCount = upcomingActions?.length ?? 0;
  const pendingPaymentCount = pendingPayments?.length ?? 0;
  const recentMeetingCount = recentMeetings?.length ?? 0;

  const statusLabel: Record<string, string> = {
    pending: "대기",
    in_progress: "진행중",
    completed: "완료",
  };

  // B3: 월별 입금 추이 데이터 가공
  const monthlyPaymentMap = new Map<string, number>();
  for (const p of allPayments ?? []) {
    if (p.completed_at) {
      const date = new Date(p.completed_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyPaymentMap.set(key, (monthlyPaymentMap.get(key) ?? 0) + Number(p.amount));
    }
  }
  const paymentTrendData = Array.from(monthlyPaymentMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({
      month: month.split("-")[1] + "월",
      amount,
    }));

  // B3: 견적 상태 분포
  const estimateStatusMap = new Map<string, number>();
  for (const e of estimates ?? []) {
    estimateStatusMap.set(e.status, (estimateStatusMap.get(e.status) ?? 0) + 1);
  }
  const ESTIMATE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft: { label: "작성중", color: "var(--chart-4)" },
    confirmed: { label: "확정", color: "var(--brand)" },
    sent: { label: "발송완료", color: "var(--chart-3)" },
    rejected: { label: "반려", color: "var(--destructive)" },
  };
  const estimateChartData = Array.from(estimateStatusMap.entries()).map(
    ([status, value]) => ({
      name: ESTIMATE_STATUS_CONFIG[status]?.label ?? status,
      value,
      color: ESTIMATE_STATUS_CONFIG[status]?.color ?? "var(--chart-5)",
    })
  );

  // B3: 회고 제출률 데이터
  const retroChartData = (projects ?? [])
    .map((p) => ({
      project: p.name.length > 8 ? p.name.slice(0, 8) + "…" : p.name,
      submitted: projectRetroMap.get(p.id) ?? 0,
      total: totalUsers,
    }))
    .slice(0, 5);

  // B5: 활동 타임라인 데이터
  const activityData = (auditLogs ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    table_name: log.table_name,
    changed_by_name: (log as any).users?.name ?? "알 수 없음",
    created_at: log.created_at,
  }));

  return (
    <div className="space-y-6">
      {/* B1: 인사말 + 날짜 */}
      <div>
        <h1 className="text-page-title">
          {getGreeting()}, {user.name}님
        </h1>
        <p className="text-page-description">{formatToday()}</p>
      </div>

      {/* B2: 퀵 액션 */}
      <QuickActions />

      {/* v0.3D: 모듈 위젯 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardScrumWidget
          scrumStatus={todayScrum?.status ?? null}
          itemCount={(todayScrum as any)?.scrum_items?.length ?? 0}
        />
        <DashboardTasksWidget tasks={todayTasks ?? []} />
        <DashboardProjectsWidget projects={activeProjects ?? []} />
        <DashboardScheduleWidget schedules={todaySchedules ?? []} />
      </div>

      {/* 요약 카드 (Bento row 1) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-card-title">
              마감 임박
            </CardTitle>
            <CalendarClock className="size-4 text-brand" />
          </CardHeader>
          <CardContent>
            <p className="text-stat-number"><CountUp target={upcomingCount} suffix="건" /></p>
            <p className="text-xs text-muted-foreground">7일 이내 마감</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-card-title">
              입금 대기
            </CardTitle>
            <CreditCard className="size-4 text-brand" />
          </CardHeader>
          <CardContent>
            <p className="text-stat-number"><CountUp target={pendingPaymentCount} suffix="건" /></p>
            <p className="text-xs text-muted-foreground">미처리 요청</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-card-title">
              최근 회의
            </CardTitle>
            <FileText className="size-4 text-brand" />
          </CardHeader>
          <CardContent>
            <p className="text-stat-number"><CountUp target={recentMeetingCount} suffix="건" /></p>
            <p className="text-xs text-muted-foreground">최근 회의록</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-card-title">
              프로젝트
            </CardTitle>
            <MessageSquareText className="size-4 text-brand" />
          </CardHeader>
          <CardContent>
            <p className="text-stat-number"><CountUp target={projects?.length ?? 0} suffix="개" /></p>
            <p className="text-xs text-muted-foreground">진행 중</p>
          </CardContent>
        </Card>
      </div>

      {/* B3: 차트 위젯 (Bento row 2) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PaymentTrendChart data={paymentTrendData} />
        <EstimateStatusChart data={estimateChartData} />
        <RetroSubmitChart data={retroChartData} />
      </div>

      {/* B4: Bento 그리드 (row 3) — 테이블 + 타임라인 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 마감 임박 액션아이템 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-section-title">마감 임박</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingActions && upcomingActions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>항목</TableHead>
                      <TableHead>마감일</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingActions.map((ai) => {
                      const daysLeft = Math.ceil(
                        (new Date(ai.due_date).getTime() - Date.now()) / 86400000
                      );
                      const dLabel = daysLeft <= 0 ? "D-day" : `D-${daysLeft}`;
                      return (
                      <TableRow key={ai.id}>
                        <TableCell className="font-medium text-sm">
                          {ai.title}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">{new Date(ai.due_date).toLocaleDateString("ko-KR")}</span>
                              </TooltipTrigger>
                              <TooltipContent>{dLabel}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {statusLabel[ai.status] ?? ai.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                7일 이내 마감 항목 없음
              </p>
            )}
          </CardContent>
        </Card>

        {/* 대기 중인 입금 요청 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-section-title">입금 대기</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments && pendingPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead>마감일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">
                          <Link
                            href={`/payments/${p.id}`}
                            className="hover:underline"
                          >
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {Number(p.amount).toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {p.due_date
                            ? new Date(p.due_date).toLocaleDateString("ko-KR")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                대기 중인 요청 없음
              </p>
            )}
          </CardContent>
        </Card>

        {/* B5: 최근 활동 타임라인 */}
        <ActivityTimeline activities={activityData} />
      </div>

      {/* 최근 회의록 + 회고 제출 현황 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-section-title">최근 회의록</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMeetings && recentMeetings.length > 0 ? (
              <div className="space-y-2">
                {recentMeetings.map((m) => (
                  <TooltipProvider key={m.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/meetings/${m.id}`}
                          className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                        >
                          <span className="text-sm font-medium truncate mr-2">{m.title}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                          </span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        {m.title} — {new Date(m.meeting_date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                회의록 없음
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-section-title">회고 제출 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((p) => {
                  const submitted = projectRetroMap.get(p.id) ?? 0;
                  const pct =
                    totalUsers > 0
                      ? Math.round((submitted / totalUsers) * 100)
                      : 0;
                  return (
                    <Link
                      key={p.id}
                      href={`/retrospective/summary/${p.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground">
                          {submitted}/{totalUsers}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-brand transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                프로젝트 없음
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

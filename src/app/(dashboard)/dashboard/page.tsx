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
import { PageHeader } from "@/components/layout/page-header";

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // 마감 임박 알림 자동 생성 (3일 이내)
  checkDeadlineNotifications(supabase, user.id).catch(() => {});

  // 마감 임박 액션아이템 (7일 이내, 미완료)
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const { data: upcomingActions } = await supabase
    .from("action_items")
    .select("*, meetings(title)")
    .in("status", ["pending", "in_progress"])
    .not("due_date", "is", null)
    .lte("due_date", sevenDaysLater.toISOString().split("T")[0])
    .order("due_date")
    .limit(5);

  // 대기 중인 입금 요청
  const { data: pendingPayments } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "pending")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(5);

  // 최근 회의록
  const { data: recentMeetings } = await supabase
    .from("meetings")
    .select("id, title, meeting_date")
    .order("meeting_date", { ascending: false })
    .limit(5);

  // 회고 제출 현황 (프로젝트별)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  const { data: retroCounts } = await supabase
    .from("retrospectives")
    .select("project_id, status");

  const { data: allUsers } = await supabase
    .from("users")
    .select("id")
    .eq("is_active", true);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`안녕하세요, ${user.name}님.`}
      />

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              마감 임박
            </CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingCount}건</p>
            <p className="text-xs text-muted-foreground">7일 이내 마감</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              입금 대기
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingPaymentCount}건</p>
            <p className="text-xs text-muted-foreground">미처리 요청</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              최근 회의
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentMeetingCount}건</p>
            <p className="text-xs text-muted-foreground">최근 회의록</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              회고 제출
            </CardTitle>
            <MessageSquareText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {projects?.length ?? 0}개
            </p>
            <p className="text-xs text-muted-foreground">프로젝트</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 마감 임박 액션아이템 */}
        <Card>
          <CardHeader>
            <CardTitle>마감 임박 액션아이템</CardTitle>
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
                  {upcomingActions.map((ai) => (
                    <TableRow key={ai.id}>
                      <TableCell className="font-medium text-sm">
                        {ai.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(ai.due_date).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {statusLabel[ai.status] ?? ai.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
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
        <Card>
          <CardHeader>
            <CardTitle>대기 중인 입금 요청</CardTitle>
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
                      <TableCell className="text-sm">
                        {Number(p.amount).toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-sm">
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

        {/* 최근 회의록 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 회의록</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMeetings && recentMeetings.length > 0 ? (
              <div className="space-y-2">
                {recentMeetings.map((m) => (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{m.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                회의록 없음
              </p>
            )}
          </CardContent>
        </Card>

        {/* 회고 제출 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>회고 제출 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((p) => {
                  const submitted = projectRetroMap.get(p.id) ?? 0;
                  const pct = totalUsers > 0 ? Math.round((submitted / totalUsers) * 100) : 0;
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
                          className="h-2 rounded-full bg-primary transition-all"
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

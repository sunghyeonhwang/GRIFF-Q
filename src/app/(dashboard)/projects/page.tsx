import Link from "next/link";
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
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";

const STATUS_LABELS: Record<string, string> = {
  active: "진행 중",
  completed: "완료",
  on_hold: "보류",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  on_hold: "outline",
};

export default async function ProjectsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, users!projects_lead_user_id_fkey(name)")
    .order("created_at", { ascending: false });

  const items = projects ?? [];
  const projectIds = items.map((p) => p.id);

  // Count related items
  const [estimatesRes, meetingsRes, retrospectivesRes, paymentsRes] =
    await Promise.all([
      projectIds.length
        ? supabase
            .from("estimates")
            .select("project_id")
            .in("project_id", projectIds)
        : { data: [] },
      projectIds.length
        ? supabase
            .from("meetings")
            .select("project_id")
            .in("project_id", projectIds)
        : { data: [] },
      projectIds.length
        ? supabase
            .from("retrospectives")
            .select("project_id")
            .in("project_id", projectIds)
        : { data: [] },
      projectIds.length
        ? supabase
            .from("payments")
            .select("project_id")
            .in("project_id", projectIds)
        : { data: [] },
    ]);

  function countByProject(data: { project_id: string }[] | null) {
    const map = new Map<string, number>();
    for (const item of data ?? []) {
      if (item.project_id) {
        map.set(item.project_id, (map.get(item.project_id) ?? 0) + 1);
      }
    }
    return map;
  }

  const estimateCounts = countByProject(estimatesRes.data);
  const meetingCounts = countByProject(meetingsRes.data);
  const retroCounts = countByProject(retrospectivesRes.data);
  const paymentCounts = countByProject(paymentsRes.data);

  const activeCount = items.filter((p) => p.status === "active").length;
  const completedCount = items.filter((p) => p.status === "completed").length;
  const onHoldCount = items.filter((p) => p.status === "on_hold").length;

  // Fetch users for the create dialog
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground">
            프로젝트를 생성하고 관련 데이터를 통합 관리합니다.
          </p>
        </div>
        <ProjectCreateDialog userId={user.id} users={allUsers ?? []} />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              보류
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{onHoldCount}건</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects table */}
      {items.length > 0 ? (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>시작일</TableHead>
                  <TableHead>종료일</TableHead>
                  <TableHead className="text-center">견적서</TableHead>
                  <TableHead className="text-center">회의록</TableHead>
                  <TableHead className="text-center">회고</TableHead>
                  <TableHead className="text-center">입금</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[p.status] ?? "outline"}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(p as any).users?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.start_date
                        ? new Date(p.start_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.end_date
                        ? new Date(p.end_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {estimateCounts.get(p.id) ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {meetingCounts.get(p.id) ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {retroCounts.get(p.id) ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {paymentCounts.get(p.id) ?? 0}
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
            아직 등록된 프로젝트가 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PostmortemCreateButton } from "@/components/retrospective/postmortem-create-button";

const SEVERITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const SEVERITY_BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  critical: "destructive",
};

export default async function PostmortemListPage() {
  await requireAuth();
  const supabase = await createClient();

  const { data: postmortems } = await supabase
    .from("postmortems")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  const items = postmortems ?? [];

  // 이미 포스트모템이 있는 프로젝트 제외
  const existingProjectIds = new Set(items.map((pm) => pm.project_id));
  const availableProjects = (projects ?? []).filter(
    (p) => !existingProjectIds.has(p.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">포스트모템</h1>
          <p className="text-muted-foreground">
            프로젝트별 장애·이슈 원인 분석과 재발 방지 대책을 기록합니다.
          </p>
        </div>
        <PostmortemCreateButton projects={availableProjects} />
      </div>

      {items.length > 0 ? (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>프로젝트</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>심각도</TableHead>
                <TableHead>발생일</TableHead>
                <TableHead>작성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((pm) => (
                <TableRow key={pm.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${pm.project_id}/postmortem`}
                      className="hover:underline"
                    >
                      {(pm as any).projects?.name ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${pm.project_id}/postmortem`}
                      className="hover:underline"
                    >
                      {pm.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        SEVERITY_BADGE_VARIANTS[pm.severity] ?? "outline"
                      }
                    >
                      {SEVERITY_LABELS[pm.severity] ?? pm.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(pm.incident_date).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(pm.created_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            아직 작성된 포스트모템이 없습니다. 위의 &quot;포스트모템 작성&quot;
            버튼을 클릭하여 작성하세요.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

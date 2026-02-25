import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">회고</h1>
          <p className="text-muted-foreground">
            프로젝트별 KPT + SSC 회고를 작성하고 취합합니다.
          </p>
        </div>
        <Link href="/retrospective/new">
          <Button>
            <Plus className="mr-2 size-4" />
            회고 작성
          </Button>
        </Link>
      </div>

      {/* 프로젝트별 취합 뷰 바로가기 */}
      {projects && projects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/retrospective/summary/${p.id}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                {p.name} 취합 뷰
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-lg border">
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
            {(!retrospectives || retrospectives.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  아직 작성된 회고가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              retrospectives.map((retro) => {
                const canEdit =
                  retro.status === "draft" ||
                  user.role === "super" ||
                  user.role === "boss";
                return (
                  <TableRow key={retro.id}>
                    <TableCell className="font-medium">
                      {(retro as any).projects?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      {(retro as any).users?.name ?? "-"}
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

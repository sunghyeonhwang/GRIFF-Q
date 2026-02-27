import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRoleActions } from "@/components/settings/user-role-actions";
import { PageHeader } from "@/components/layout/page-header";

const ROLE_LABELS: Record<string, string> = {
  super: "슈퍼관리자",
  boss: "대표",
  manager: "매니저",
  normal: "일반",
};

export default async function UsersPage() {
  const currentUser = await requireRole("boss");
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at");

  const items = users ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="계정 관리"
        description="등록된 사용자 목록과 역할을 관리합니다."
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>최근 로그인</TableHead>
                <TableHead>가입일</TableHead>
                {currentUser.role === "super" && (
                  <TableHead>역할 변경</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "super"
                            ? "default"
                            : user.role === "boss"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "destructive"}
                      >
                        {user.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    {currentUser.role === "super" && (
                      <TableCell>
                        {user.id !== currentUser.id ? (
                          <UserRoleActions
                            userId={user.id}
                            currentRole={user.role}
                            currentUserRole={currentUser.role}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            본인
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={currentUser.role === "super" ? 7 : 6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    등록된 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

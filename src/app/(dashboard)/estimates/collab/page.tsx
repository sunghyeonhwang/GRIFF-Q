import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default async function CollabEstimatesPage() {
  await requireAuth();
  const supabase = await createClient();

  const { data: estimates } = await supabase
    .from("estimates")
    .select("id, project_name, client_name, status, estimate_date, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">동시견적 확인</h1>
        <p className="text-muted-foreground">
          실시간으로 견적서를 함께 편집하고 변경사항을 즉시 확인할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-5" />
            준비 중
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            동시견적 확인 기능은 현재 개발 중입니다. Supabase Realtime을 활용한
            실시간 동시 편집 기능이 곧 추가됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

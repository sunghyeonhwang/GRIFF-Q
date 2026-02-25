import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EstimateForm } from "@/components/estimates/estimate-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { LOCK_TIMEOUT_MINUTES } from "@/lib/estimate-constants";

export default async function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, users!estimates_created_by_fkey(name)")
    .eq("id", id)
    .single();

  if (!estimate) notFound();

  const { data: estimateItems } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  const canEdit =
    estimate.status !== "sent" ||
    user.role === "super" ||
    user.role === "boss";

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/estimates/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">견적서 수정</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            수정 권한이 없습니다. 발송완료 상태의 견적서는 관리자만 수정할 수 있습니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  // 편집 잠금 체크
  if (estimate.locked_by && estimate.locked_by !== user.id && estimate.locked_at) {
    const lockedAt = new Date(estimate.locked_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lockedAt.getTime()) / (1000 * 60);

    if (diffMinutes < LOCK_TIMEOUT_MINUTES) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/estimates/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">견적서 수정</h1>
          </div>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              다른 사용자가 편집 중입니다. 잠시 후 다시 시도해 주세요.
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/estimates/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">견적서 수정</h1>
      </div>
      <EstimateForm
        userId={user.id}
        initialData={estimate}
        initialItems={estimateItems ?? []}
      />
    </div>
  );
}

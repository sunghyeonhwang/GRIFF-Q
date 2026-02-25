import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PaymentForm } from "@/components/payments/payment-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (!payment) notFound();

  const canEdit =
    payment.status !== "completed" ||
    user.role === "super" ||
    user.role === "boss";

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">수정 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/payments/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">결제 요청 수정</h1>
      </div>
      <PaymentForm userId={user.id} initialData={payment} />
    </div>
  );
}

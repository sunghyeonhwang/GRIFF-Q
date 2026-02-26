"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PaymentStatusActionsProps {
  paymentId: string;
  userId: string;
  paymentName?: string;
  paymentAmount?: number;
}

export function PaymentStatusActions({
  paymentId,
  userId,
  paymentName,
  paymentAmount,
}: PaymentStatusActionsProps) {
  const router = useRouter();

  async function markCompleted() {
    const supabase = createClient();
    const { error } = await supabase
      .from("payments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .eq("id", paymentId);

    if (error) {
      alert("상태 변경 실패: " + error.message);
      return;
    }

    // Create notification for all active users
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true);

    if (users?.length) {
      const name = paymentName ?? "결제";
      const amount = paymentAmount
        ? ` ${paymentAmount.toLocaleString()}원`
        : "";
      const rows = users.map((u) => ({
        user_id: u.id,
        type: `payment_completed_${paymentId}`,
        title: "결제 완료",
        message: `"${name}"${amount} 처리 완료`,
        link: `/payments/${paymentId}`,
      }));
      await supabase.from("notifications").insert(rows);
    }

    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={markCompleted}>
      <Check className="mr-1 size-3" />
      완료
    </Button>
  );
}

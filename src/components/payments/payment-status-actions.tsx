"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PaymentStatusActionsProps {
  paymentId: string;
  userId: string;
}

export function PaymentStatusActions({ paymentId, userId }: PaymentStatusActionsProps) {
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
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={markCompleted}>
      <Check className="mr-1 size-3" />
      완료
    </Button>
  );
}

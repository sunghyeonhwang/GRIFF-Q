import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PaymentForm } from "@/components/payments/payment-form";

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

  const readOnly = payment.status === "completed" &&
    user.role !== "super" &&
    user.role !== "boss";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {readOnly ? "결제 요청 상세" : "결제 요청 수정"}
        </h1>
      </div>
      <PaymentForm
        userId={user.id}
        initialData={payment}
        readOnly={readOnly}
      />
    </div>
  );
}

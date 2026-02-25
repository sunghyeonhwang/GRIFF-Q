import { requireAuth } from "@/lib/auth";
import { PaymentForm } from "@/components/payments/payment-form";

export default async function NewPaymentPage() {
  const user = await requireAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">결제 요청 등록</h1>
        <p className="text-muted-foreground">
          입금/결제 요청 정보를 입력합니다.
        </p>
      </div>
      <PaymentForm userId={user.id} />
    </div>
  );
}

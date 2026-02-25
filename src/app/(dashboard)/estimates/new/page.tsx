import { requireAuth } from "@/lib/auth";
import { EstimateForm } from "@/components/estimates/estimate-form";

export default async function NewEstimatePage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">견적서 생성</h1>
        <p className="text-muted-foreground">
          새 견적서 정보를 입력합니다.
        </p>
      </div>
      <EstimateForm userId={user.id} />
    </div>
  );
}

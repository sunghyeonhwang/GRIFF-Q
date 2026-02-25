import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          안녕하세요, {user.name}님. ({user.role})
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            마감 임박
          </h3>
          <p className="mt-2 text-2xl font-bold">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            입금 요청
          </h3>
          <p className="mt-2 text-2xl font-bold">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            진행 견적
          </h3>
          <p className="mt-2 text-2xl font-bold">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            회고 제출
          </h3>
          <p className="mt-2 text-2xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
}

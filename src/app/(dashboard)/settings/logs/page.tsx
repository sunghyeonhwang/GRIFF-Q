import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditLogViewer } from "@/components/settings/audit-log-viewer";

export default async function AuditLogsPage() {
  await requireRole("boss");
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, users!audit_logs_changed_by_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">변경 이력</h2>
        <p className="text-sm text-muted-foreground">
          시스템 내 데이터 변경 이력을 확인합니다. (최근 100건)
        </p>
      </div>
      <AuditLogViewer logs={logs ?? []} />
    </div>
  );
}

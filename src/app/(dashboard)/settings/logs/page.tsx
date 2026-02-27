import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditLogViewer } from "@/components/settings/audit-log-viewer";
import { PageHeader } from "@/components/layout/page-header";
import { parsePaginationParams, parseSortParams, buildPaginationRange } from "@/lib/pagination";

const SORTABLE_COLUMNS = ["created_at", "table_name", "action"];

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("boss");
  const supabase = await createClient();
  const params = await searchParams;

  const { page, pageSize } = parsePaginationParams(params);
  const { sortBy, sortOrder } = parseSortParams(params, SORTABLE_COLUMNS, "created_at");
  const { from, to } = buildPaginationRange(page, pageSize);

  const { data: logs, count } = await supabase
    .from("audit_logs")
    .select("*, users!audit_logs_changed_by_fkey(name)", { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  return (
    <div className="space-y-6">
      <PageHeader
        title="변경 이력"
        description="시스템 내 데이터 변경 이력을 확인합니다."
      />
      <AuditLogViewer
        logs={logs ?? []}
        page={page}
        pageSize={pageSize}
        totalCount={count ?? 0}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchParams={params}
      />
    </div>
  );
}

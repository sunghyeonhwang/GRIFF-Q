"use server";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_TABLES = new Set([
  "estimates",
  "estimate_items",
  "payments",
  "meetings",
  "retrospectives",
  "avatars",
]);

// 복원 시 제외할 메타 컬럼 (DB 트리거/기본값이 관리)
const EXCLUDE_COLUMNS = new Set(["created_at", "updated_at"]);

function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!EXCLUDE_COLUMNS.has(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function restoreAuditLog(logId: string) {
  await requireRole("boss");
  const supabase = await createClient();

  // 로그 조회
  const { data: log, error: logError } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("id", logId)
    .single();

  if (logError || !log) {
    return { success: false, error: "감사 로그를 찾을 수 없습니다." };
  }

  const { table_name, row_id, action, old_data, new_data } = log;

  if (!ALLOWED_TABLES.has(table_name)) {
    return { success: false, error: `복원이 허용되지 않는 테이블입니다: ${table_name}` };
  }

  let result;

  if (action === "update") {
    // 수정 → old_data로 되돌리기
    if (!old_data) {
      return { success: false, error: "변경 전 데이터(old_data)가 없습니다." };
    }
    const data = sanitizeData(old_data);
    result = await supabase
      .from(table_name)
      .update(data)
      .eq("id", row_id);
  } else if (action === "delete") {
    // 삭제 → old_data로 다시 INSERT
    if (!old_data) {
      return { success: false, error: "삭제 전 데이터(old_data)가 없습니다." };
    }
    const data = sanitizeData(old_data);
    result = await supabase
      .from(table_name)
      .upsert(data);
  } else if (action === "insert") {
    // 생성 취소 → 해당 row 삭제
    result = await supabase
      .from(table_name)
      .delete()
      .eq("id", row_id);
  } else {
    return { success: false, error: `알 수 없는 액션: ${action}` };
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  revalidatePath("/settings/logs");
  return { success: true };
}

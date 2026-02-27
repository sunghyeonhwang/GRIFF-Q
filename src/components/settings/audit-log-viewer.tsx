"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw } from "lucide-react";
import { restoreAuditLog } from "@/app/(dashboard)/settings/logs/actions";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "insert" | "update" | "delete";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string;
  created_at: string;
  users: { name: string } | null;
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  searchParams: Record<string, string | string[] | undefined>;
}

const TABLE_NAME_MAP: Record<string, string> = {
  estimates: "견적서",
  payments: "입금/결제",
  meetings: "회의록",
  retrospectives: "회고",
  avatars: "아바타",
  estimate_items: "견적항목",
};

const ACTION_MAP: Record<string, string> = {
  insert: "생성",
  update: "수정",
  delete: "삭제",
};

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  insert: "default",
  update: "secondary",
  delete: "destructive",
};

const TABLE_FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "estimates", label: "견적서" },
  { value: "payments", label: "입금/결제" },
  { value: "meetings", label: "회의록" },
  { value: "retrospectives", label: "회고" },
  { value: "avatars", label: "아바타" },
  { value: "estimate_items", label: "견적항목" },
];

/** 서버/클라이언트 간 hydration 불일치를 방지하기 위해 고정 포맷 사용 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 필드명 → 한글 레이블 매핑
const FIELD_LABEL_MAP: Record<string, string> = {
  // 공통
  id: "ID",
  created_at: "생성일",
  updated_at: "수정일",
  note: "비고",
  status: "상태",
  // estimates
  project_name: "프로젝트명",
  client_name: "클라이언트",
  estimate_date: "견적일",
  valid_until: "유효기한",
  locked_by: "잠금자",
  locked_at: "잠금일",
  created_by: "작성자",
  project_id: "프로젝트 ID",
  // estimate_items
  estimate_id: "견적서 ID",
  item_name: "항목명",
  quantity: "수량",
  unit_price: "단가",
  sort_order: "정렬순서",
  highlight: "강조색",
  // payments
  amount: "금액",
  payment_date: "결제일",
  payment_method: "결제방법",
  description: "설명",
  category: "카테고리",
  direction: "유형",
  counterpart: "거래처",
  // meetings
  title: "제목",
  meeting_date: "회의일",
  location: "장소",
  summary: "요약",
  participants: "참석자",
  action_items: "실행항목",
  // retrospectives
  sprint_name: "스프린트명",
  went_well: "잘한 점",
  to_improve: "개선할 점",
  action_plan: "실행계획",
  // avatars
  name: "이름",
  role: "역할",
  personality: "성격",
  avatar_url: "아바타 URL",
  is_active: "활성여부",
  // notifications
  type: "유형",
  message: "메시지",
  is_read: "읽음여부",
  user_id: "사용자 ID",
  link: "링크",
};

// 시스템/내부 필드 (상세에서 숨김)
const HIDDEN_FIELDS = new Set(["id", "created_at", "updated_at", "estimate_id", "created_by", "project_id", "user_id"]);

function getFieldLabel(field: string): string {
  return FIELD_LABEL_MAP[field] ?? field;
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";

  // 숫자 (금액/단가/수량)
  if (
    (field === "unit_price" || field === "amount") &&
    typeof value === "number"
  ) {
    return `${formatNumber(value)}원`;
  }
  if (field === "quantity" && typeof value === "number") {
    return formatNumber(value);
  }

  // 날짜
  if (
    typeof value === "string" &&
    (field.endsWith("_at") || field.endsWith("_date") || field === "valid_until")
  ) {
    try {
      return formatDate(value);
    } catch {
      return String(value);
    }
  }

  // boolean
  if (typeof value === "boolean") return value ? "예" : "아니오";

  // 배열/객체
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

/** update 시 old_data / new_data 비교 → 변경된 필드만 추출 */
function getChangedFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): string[] {
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  const changed: string[] = [];
  for (const key of allKeys) {
    if (HIDDEN_FIELDS.has(key)) continue;
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changed.push(key);
    }
  }
  return changed;
}

/** 단일 데이터셋의 보이는 필드 목록 */
function getVisibleFields(data: Record<string, unknown>): string[] {
  return Object.keys(data).filter((k) => !HIDDEN_FIELDS.has(k));
}

const RESTORE_LABEL: Record<string, string> = {
  insert: "생성 취소 (삭제)",
  update: "변경 전으로 복원",
  delete: "삭제 복원 (재생성)",
};

export function AuditLogViewer({ logs, page, pageSize, totalCount, sortBy, sortOrder, searchParams }: AuditLogViewerProps) {
  const [tableFilter, setTableFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [restoreResult, setRestoreResult] = useState<{
    logId: string;
    success: boolean;
    error?: string;
  } | null>(null);

  function handleRestore(logId: string) {
    startTransition(async () => {
      const result = await restoreAuditLog(logId);
      setRestoreResult({ logId, ...result });
    });
  }

  const filteredLogs =
    tableFilter === "all"
      ? logs
      : logs.filter((log) => log.table_name === tableFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">테이블 필터:</span>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TABLE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredLogs.length}건
        </span>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="created_at" label="날짜" currentSort={sortBy} currentOrder={sortOrder} searchParams={searchParams} />
                <SortableTableHead column="table_name" label="테이블" currentSort={sortBy} currentOrder={sortOrder} searchParams={searchParams} />
                <SortableTableHead column="action" label="액션" currentSort={sortBy} currentOrder={sortOrder} searchParams={searchParams} />
                <TableHead>작업자</TableHead>
                <TableHead>변경 내용</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TABLE_NAME_MAP[log.table_name] ?? log.table_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[log.action] ?? "outline"}>
                        {ACTION_MAP[log.action] ?? log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.users?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            상세
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              변경 상세 -{" "}
                              {TABLE_NAME_MAP[log.table_name] ?? log.table_name}{" "}
                              {ACTION_MAP[log.action] ?? log.action}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[400px]">
                            {log.action === "update" &&
                            log.old_data &&
                            log.new_data ? (
                              /* 수정: 변경된 필드만 비교 테이블 */
                              (() => {
                                const changed = getChangedFields(
                                  log.old_data,
                                  log.new_data
                                );
                                return changed.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[120px]">
                                          항목
                                        </TableHead>
                                        <TableHead>변경 전</TableHead>
                                        <TableHead>변경 후</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {changed.map((field) => (
                                        <TableRow key={field}>
                                          <TableCell className="font-medium text-sm">
                                            {getFieldLabel(field)}
                                          </TableCell>
                                          <TableCell className="text-sm text-muted-foreground line-through">
                                            {formatFieldValue(
                                              field,
                                              log.old_data![field]
                                            )}
                                          </TableCell>
                                          <TableCell className="text-sm font-medium">
                                            {formatFieldValue(
                                              field,
                                              log.new_data![field]
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <p className="text-sm text-muted-foreground py-4 text-center">
                                    변경된 필드가 없습니다. (시스템 필드만
                                    변경됨)
                                  </p>
                                );
                              })()
                            ) : (
                              /* 생성/삭제: 단일 데이터 목록 */
                              (() => {
                                const data =
                                  log.action === "delete"
                                    ? log.old_data
                                    : log.new_data;
                                if (!data)
                                  return (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                      데이터 없음
                                    </p>
                                  );
                                const fields = getVisibleFields(data);
                                return (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[120px]">
                                          항목
                                        </TableHead>
                                        <TableHead>값</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {fields.map((field) => (
                                        <TableRow key={field}>
                                          <TableCell className="font-medium text-sm">
                                            {getFieldLabel(field)}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {formatFieldValue(
                                              field,
                                              data[field]
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                );
                              })()
                            )}
                          </ScrollArea>

                          {/* 복원 버튼 */}
                          <div className="flex items-center justify-between border-t pt-4 mt-4">
                            {restoreResult?.logId === log.id ? (
                              <p
                                className={`text-sm ${restoreResult.success ? "text-green-600" : "text-destructive"}`}
                              >
                                {restoreResult.success
                                  ? "복원 완료 (이력이 자동 생성됨)"
                                  : `복원 실패: ${restoreResult.error}`}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                복원 시 해당 row만 이 시점의 데이터로 되돌립니다. 복원
                                자체도 변경이력에 기록됩니다.
                              </p>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    isPending ||
                                    restoreResult?.logId === log.id
                                  }
                                >
                                  <RotateCcw className="mr-2 size-4" />
                                  {RESTORE_LABEL[log.action] ?? "복원"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    이 시점으로 복원하시겠습니까?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {log.action === "update" &&
                                      "해당 데이터를 변경 전 상태로 되돌립니다. 이후 변경사항은 덮어씌워집니다."}
                                    {log.action === "delete" &&
                                      "삭제된 데이터를 다시 생성합니다."}
                                    {log.action === "insert" &&
                                      "생성된 데이터를 삭제합니다. 관련된 하위 데이터가 있으면 실패할 수 있습니다."}
                                    {" "}이 작업 자체도 변경이력에 기록됩니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRestore(log.id)}
                                  >
                                    복원 실행
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    변경 이력이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} searchParams={searchParams} />
    </div>
  );
}

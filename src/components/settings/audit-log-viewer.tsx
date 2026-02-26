"use client";

import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [tableFilter, setTableFilter] = useState("all");

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
                <TableHead>날짜</TableHead>
                <TableHead>테이블</TableHead>
                <TableHead>액션</TableHead>
                <TableHead>작업자</TableHead>
                <TableHead>변경 내용</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("ko-KR")}
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
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-2 text-sm font-medium">
                                변경 전 (old_data)
                              </p>
                              <ScrollArea className="h-[300px] rounded-md border p-3">
                                <pre className="text-xs whitespace-pre-wrap break-all">
                                  {log.old_data
                                    ? JSON.stringify(log.old_data, null, 2)
                                    : "(없음)"}
                                </pre>
                              </ScrollArea>
                            </div>
                            <div>
                              <p className="mb-2 text-sm font-medium">
                                변경 후 (new_data)
                              </p>
                              <ScrollArea className="h-[300px] rounded-md border p-3">
                                <pre className="text-xs whitespace-pre-wrap break-all">
                                  {log.new_data
                                    ? JSON.stringify(log.new_data, null, 2)
                                    : "(없음)"}
                                </pre>
                              </ScrollArea>
                            </div>
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
    </div>
  );
}

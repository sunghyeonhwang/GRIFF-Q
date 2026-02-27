"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, FileSpreadsheet, CheckSquare, Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";

export interface MeetingRow {
  id: string;
  title: string;
  content: string | null;
  meeting_date: string;
  attendees: string[];
  created_by: string;
  creatorName: string;
  actionTotal: number;
  actionCompleted: number;
}

interface MeetingListClientProps {
  meetings: MeetingRow[];
  userMap: Record<string, string>;
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  searchParams: Record<string, string | string[] | undefined>;
}

type DateRange = "all" | "7" | "30" | "90";

export function MeetingListClient({
  meetings,
  userMap,
  page,
  pageSize,
  totalCount,
  sortBy,
  sortOrder,
  searchParams,
}: MeetingListClientProps) {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const filtered = useMemo(() => {
    let result = [...meetings];

    // Keyword search (client-side within current page)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.content && m.content.toLowerCase().includes(q))
      );
    }

    // Date range filter (client-side within current page)
    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((m) => new Date(m.meeting_date) >= cutoff);
    }

    return result;
  }, [meetings, search, dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">회의록</h1>
          <p className="text-muted-foreground">
            회의록을 작성하고 액션아이템을 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/meetings/action-items">
            <Button variant="outline">
              <CheckSquare className="mr-2 size-4" />
              액션아이템
            </Button>
          </Link>
          <Link href="/meetings/import">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 size-4" />
              Sheets 가져오기
            </Button>
          </Link>
          <Link href="/meetings/new">
            <Button>
              <Plus className="mr-2 size-4" />
              회의록 작성
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="제목 또는 내용으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 기간</SelectItem>
            <SelectItem value="7">최근 7일</SelectItem>
            <SelectItem value="30">최근 30일</SelectItem>
            <SelectItem value="90">최근 90일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="title" label="제목" currentSort={sortBy} currentOrder={sortOrder} searchParams={searchParams} />
              <SortableTableHead column="meeting_date" label="날짜" currentSort={sortBy} currentOrder={sortOrder} searchParams={searchParams} />
              <TableHead>참석자</TableHead>
              <TableHead>액션아이템</TableHead>
              <TableHead>작성자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  {search || dateRange !== "all"
                    ? "검색 결과가 없습니다."
                    : "아직 작성된 회의록이 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const attendeeNames = m.attendees
                  ?.map((id) => userMap[id])
                  .filter(Boolean)
                  .join(", ");
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/meetings/${m.id}`}
                        className="hover:underline"
                      >
                        {m.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(m.meeting_date).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm">
                      {attendeeNames || "-"}
                    </TableCell>
                    <TableCell>
                      {m.actionTotal > 0 ? (
                        <Badge
                          variant={
                            m.actionCompleted === m.actionTotal ? "default" : "outline"
                          }
                        >
                          {m.actionCompleted}/{m.actionTotal}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.creatorName || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} searchParams={searchParams} />
    </div>
  );
}

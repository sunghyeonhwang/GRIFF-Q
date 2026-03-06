import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { ProjectProgressBar } from "@/components/projects/project-progress-bar";

interface ProjectListItem {
  id: string;
  name: string;
  status: string;
  project_type?: string | null;
  priority?: number | null;
  progress?: number | null;
  start_date: string | null;
  end_date: string | null;
  users?: { name: string } | null;
  [key: string]: unknown;
}

const STATUS_LABELS: Record<string, string> = {
  active: "진행 중",
  completed: "완료",
  on_hold: "보류",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  on_hold: "outline",
};

const TYPE_LABELS: Record<string, string> = {
  general: "일반",
  event: "행사",
  content: "콘텐츠",
  maintenance: "유지보수",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "P1",
  2: "P2",
  3: "P3",
  4: "P4",
  5: "P5",
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-red-500 dark:text-red-400",
  2: "text-orange-500 dark:text-orange-400",
  3: "text-blue-500 dark:text-blue-400",
  4: "text-gray-500 dark:text-gray-400",
  5: "text-gray-400 dark:text-gray-500",
};

interface ProjectListViewProps {
  items: ProjectListItem[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  searchParams: Record<string, string | string[] | undefined>;
}

export function ProjectListView({
  items,
  sortBy,
  sortOrder,
  searchParams,
}: ProjectListViewProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                column="name"
                label="프로젝트명"
                currentSort={sortBy}
                currentOrder={sortOrder}
                searchParams={searchParams}
              />
              <SortableTableHead
                column="status"
                label="상태"
                currentSort={sortBy}
                currentOrder={sortOrder}
                searchParams={searchParams}
              />
              <th
                data-slot="table-head"
                className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap"
              >
                종류
              </th>
              <th
                data-slot="table-head"
                className="text-foreground h-10 px-2 text-center align-middle font-medium whitespace-nowrap"
              >
                우선순위
              </th>
              <th
                data-slot="table-head"
                className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap min-w-[120px]"
              >
                진행률
              </th>
              <th
                data-slot="table-head"
                className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap"
              >
                담당자
              </th>
              <SortableTableHead
                column="start_date"
                label="시작일"
                currentSort={sortBy}
                currentOrder={sortOrder}
                searchParams={searchParams}
              />
              <th
                data-slot="table-head"
                className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap"
              >
                종료일
              </th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/projects/${p.id}`}
                    className="hover:underline"
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[p.status] ?? "outline"}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {p.project_type ? (
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[p.project_type] ?? p.project_type}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {p.priority ? (
                    <span
                      className={`text-xs font-semibold ${PRIORITY_COLORS[p.priority] ?? ""}`}
                    >
                      {PRIORITY_LABELS[p.priority] ?? `P${p.priority}`}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <ProjectProgressBar progress={p.progress ?? 0} />
                </TableCell>
                <TableCell className="text-sm">
                  {p.users?.name ?? "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {p.start_date
                    ? new Date(p.start_date).toLocaleDateString("ko-KR")
                    : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {p.end_date
                    ? new Date(p.end_date).toLocaleDateString("ko-KR")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

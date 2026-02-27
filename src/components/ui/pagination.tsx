import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildSearchParamsString } from "@/lib/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  searchParams: Record<string, string | string[] | undefined>;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

export function Pagination({ page, pageSize, totalCount, searchParams }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalCount <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const pages = getPageNumbers(page, totalPages);

  function href(p: number) {
    return buildSearchParamsString(searchParams, { page: String(p) });
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground">
        {from}-{to} / 총 {totalCount.toLocaleString()}건
      </p>
      <nav className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className="inline-flex items-center justify-center size-8 rounded-md border text-sm hover:bg-brand-muted transition-colors"
          >
            <ChevronLeft className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center size-8 rounded-md border text-sm opacity-40 cursor-not-allowed">
            <ChevronLeft className="size-4" />
          </span>
        )}

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="inline-flex items-center justify-center size-8 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-md text-sm font-medium transition-colors",
                p === page
                  ? "bg-brand text-brand-foreground"
                  : "border hover:bg-brand-muted",
              )}
            >
              {p}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className="inline-flex items-center justify-center size-8 rounded-md border text-sm hover:bg-brand-muted transition-colors"
          >
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center size-8 rounded-md border text-sm opacity-40 cursor-not-allowed">
            <ChevronRight className="size-4" />
          </span>
        )}
      </nav>
    </div>
  );
}

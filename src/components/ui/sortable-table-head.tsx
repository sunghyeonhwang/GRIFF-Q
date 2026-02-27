import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildSearchParamsString } from "@/lib/pagination";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface SortableTableHeadProps {
  column: string;
  label: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  searchParams: Record<string, string | string[] | undefined>;
  className?: string;
}

export function SortableTableHead({
  column,
  label,
  currentSort,
  currentOrder,
  searchParams,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort === column;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";

  const href = buildSearchParamsString(searchParams, {
    sortBy: column,
    sortOrder: nextOrder,
    page: "1",
  });

  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap",
        className,
      )}
    >
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1 hover:text-brand transition-colors",
          isActive && "text-brand",
        )}
      >
        {label}
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
        ) : (
          <ArrowUpDown className="size-3.5 opacity-40" />
        )}
      </Link>
    </th>
  );
}

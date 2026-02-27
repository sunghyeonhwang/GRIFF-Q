import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildSearchParamsString } from "@/lib/pagination";
import { LayoutList, LayoutGrid } from "lucide-react";

interface ViewToggleProps {
  currentView: "table" | "card";
  searchParams: Record<string, string | string[] | undefined>;
}

export function ViewToggle({ currentView, searchParams }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border p-0.5">
      <Link
        href={buildSearchParamsString(searchParams, { view: "table" })}
        className={cn(
          "inline-flex items-center justify-center rounded-sm p-1.5 transition-colors",
          currentView === "table"
            ? "bg-brand text-brand-foreground"
            : "hover:bg-brand-muted text-muted-foreground",
        )}
        title="테이블 뷰"
      >
        <LayoutList className="size-4" />
      </Link>
      <Link
        href={buildSearchParamsString(searchParams, { view: "card" })}
        className={cn(
          "inline-flex items-center justify-center rounded-sm p-1.5 transition-colors",
          currentView === "card"
            ? "bg-brand text-brand-foreground"
            : "hover:bg-brand-muted text-muted-foreground",
        )}
        title="카드 뷰"
      >
        <LayoutGrid className="size-4" />
      </Link>
    </div>
  );
}

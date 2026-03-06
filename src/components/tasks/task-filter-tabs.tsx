"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ListFilter,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  User,
} from "lucide-react";

export type TaskFilter = "all" | "today" | "upcoming" | "completed" | "my";

const FILTERS: { key: TaskFilter; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "전체", icon: ListFilter },
  { key: "today", label: "오늘", icon: CalendarClock },
  { key: "upcoming", label: "예정", icon: CalendarDays },
  { key: "completed", label: "완료", icon: CheckCircle2 },
  { key: "my", label: "내 작업", icon: User },
];

interface TaskFilterTabsProps {
  currentFilter: TaskFilter;
}

export function TaskFilterTabs({ currentFilter }: TaskFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleFilter(filter: TaskFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {FILTERS.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={currentFilter === key ? "default" : "ghost"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => handleFilter(key)}
        >
          <Icon className="size-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutList, Columns3 } from "lucide-react";

export type TaskViewType = "list" | "board";

interface TaskViewToggleProps {
  currentView: TaskViewType;
}

export function TaskViewToggle({ currentView }: TaskViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleView(view: TaskViewType) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center border rounded-lg p-0.5 gap-0.5">
      <Button
        variant={currentView === "list" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2.5 gap-1.5 text-xs"
        onClick={() => handleView("list")}
      >
        <LayoutList className="size-3.5" />
        목록
      </Button>
      <Button
        variant={currentView === "board" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2.5 gap-1.5 text-xs"
        onClick={() => handleView("board")}
      >
        <Columns3 className="size-3.5" />
        보드
      </Button>
    </div>
  );
}

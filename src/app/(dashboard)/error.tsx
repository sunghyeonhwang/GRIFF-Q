"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-semibold">문제가 발생했습니다</h1>
      <p className="max-w-md text-muted-foreground">
        {error.message || "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
      </p>
      <Button onClick={reset} className="mt-2">
        다시 시도
      </Button>
    </div>
  );
}

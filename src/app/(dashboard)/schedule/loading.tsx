import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Skeleton className="h-64 hidden lg:block" />
        <Skeleton className="h-[600px]" />
      </div>
    </div>
  );
}

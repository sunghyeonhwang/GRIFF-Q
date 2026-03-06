import { cn } from "@/lib/utils";

interface ProjectProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
}

export function ProjectProgressBar({
  progress,
  className,
  showLabel = true,
}: ProjectProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const barColor =
    clampedProgress >= 100
      ? "bg-green-500 dark:bg-green-400"
      : clampedProgress >= 70
        ? "bg-blue-500 dark:bg-blue-400"
        : clampedProgress >= 30
          ? "bg-yellow-500 dark:bg-yellow-400"
          : "bg-gray-400 dark:bg-gray-500";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-[60px]">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  );
}

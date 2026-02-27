import Link from "next/link";
import { cn } from "@/lib/utils";

interface DataCardProps {
  href: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DataCard({ href, title, children, className }: DataCardProps) {
  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          "rounded-lg border bg-glass-bg backdrop-blur-sm p-4 transition-all",
          "hover:border-brand/40 hover:shadow-md hover:scale-[1.01]",
          "space-y-3",
          className,
        )}
      >
        <h3 className="font-medium truncate group-hover:text-brand transition-colors">
          {title}
        </h3>
        {children}
      </div>
    </Link>
  );
}

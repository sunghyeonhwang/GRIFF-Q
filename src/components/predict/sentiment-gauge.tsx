"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface SentimentGaugeProps {
  sentiment: "positive" | "neutral" | "negative";
  warning?: string | null;
}

const SENTIMENT_CONFIG = {
  negative: { position: "left-[15%]", label: "부정적", color: "text-red-500" },
  neutral: { position: "left-[50%]", label: "중립", color: "text-yellow-500" },
  positive: { position: "left-[85%]", label: "긍정적", color: "text-green-500" },
} as const;

export function SentimentGauge({ sentiment, warning }: SentimentGaugeProps) {
  const config = SENTIMENT_CONFIG[sentiment];

  return (
    <div className="space-y-1.5">
      {/* Gauge bar */}
      <div className="relative h-2 w-32 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-red-300 dark:bg-red-800" />
          <div className="flex-1 bg-yellow-300 dark:bg-yellow-800" />
          <div className="flex-1 bg-green-300 dark:bg-green-800" />
        </div>
        {/* Indicator dot */}
        <div
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-background bg-foreground ${config.position}`}
        />
      </div>
      <span className={`text-[10px] font-medium ${config.color}`}>
        {config.label}
      </span>

      {/* Warning badge */}
      {warning && (
        <div className="mt-1">
          <Badge variant="destructive" className="text-[10px] font-normal gap-1">
            <AlertTriangle className="size-2.5" />
            {warning}
          </Badge>
        </div>
      )}
    </div>
  );
}

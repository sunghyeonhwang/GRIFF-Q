"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldX, ShieldOff } from "lucide-react";
import { RISK_LEVEL_CONFIG, type RiskLevel } from "@/types/review.types";

const ICON_MAP = {
  Shield,
  ShieldAlert,
  ShieldX,
  ShieldOff,
};

const COLOR_VARIANTS: Record<string, string> = {
  green:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  yellow:
    "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  orange:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

interface ReviewRiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  className?: string;
}

export function ReviewRiskBadge({
  level,
  showIcon = true,
  className,
}: ReviewRiskBadgeProps) {
  const config = RISK_LEVEL_CONFIG[level];
  const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP] ?? Shield;
  const colorClass = COLOR_VARIANTS[config.color] ?? COLOR_VARIANTS.green;

  return (
    <Badge variant="outline" className={`${colorClass} ${className ?? ""}`}>
      {showIcon && <IconComponent className="mr-1 size-3" />}
      {config.label}
    </Badge>
  );
}

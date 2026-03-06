"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCRUM_STEP_CONFIG, type ScrumStatus } from "@/types/scrum.types";

interface ScrumStepperProps {
  currentStatus: ScrumStatus;
}

const STEPS = Object.entries(SCRUM_STEP_CONFIG) as [
  keyof typeof SCRUM_STEP_CONFIG,
  (typeof SCRUM_STEP_CONFIG)[keyof typeof SCRUM_STEP_CONFIG],
][];

function getStepNumber(status: ScrumStatus): number {
  if (status === "completed") return 4;
  return SCRUM_STEP_CONFIG[status as keyof typeof SCRUM_STEP_CONFIG]?.step ?? 0;
}

export function ScrumStepper({ currentStatus }: ScrumStepperProps) {
  const currentStep = getStepNumber(currentStatus);

  return (
    <div className="flex items-center gap-2 md:gap-4">
      {STEPS.map(([key, config], idx) => {
        const isCompleted = currentStep > config.step;
        const isCurrent = currentStep === config.step;

        return (
          <div key={key} className="flex items-center gap-2 md:gap-4 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : config.step}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {config.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground truncate">
                    {config.description}
                  </p>
                )}
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

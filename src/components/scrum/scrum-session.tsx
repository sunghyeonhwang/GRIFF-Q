"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkipForward } from "lucide-react";
import type { DailyScrum, ScrumItem, ScrumStatus, CarryOverItem } from "@/types/scrum.types";
import { updateScrumStatus } from "@/actions/scrum";
import { ScrumStepper } from "./scrum-stepper";
import { ScrumBrainstorm } from "./scrum-brainstorm";
import { ScrumPrioritize } from "./scrum-prioritize";
import { ScrumSchedule } from "./scrum-schedule";
import { ScrumSummary } from "./scrum-summary";
import { ScrumSkipDialog } from "./scrum-skip-dialog";
import { ScrumReview } from "./scrum-review";

interface ScrumSessionProps {
  scrum: DailyScrum;
  items: ScrumItem[];
  carryOverItems: CarryOverItem[];
  todaySchedules: { title: string; start_time: string; end_time: string }[];
  dueSoonTasks: { id: string; title: string; due_date: string }[];
  userName: string;
  userId: string;
}

export function ScrumSession({
  scrum,
  items: initialItems,
  carryOverItems,
  todaySchedules,
  dueSoonTasks,
  userName,
  userId,
}: ScrumSessionProps) {
  const [currentStatus, setCurrentStatus] = useState<ScrumStatus>(scrum.status);
  const [localItems, setLocalItems] = useState<ScrumItem[]>(initialItems);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const handleStepChange = useCallback(
    async (newStatus: ScrumStatus) => {
      setCurrentStatus(newStatus);
      await updateScrumStatus(scrum.id, newStatus);
    },
    [scrum.id]
  );

  const handleItemsChange = useCallback((items: ScrumItem[]) => {
    setLocalItems(items);
  }, []);

  if (currentStatus === "skipped") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium">오늘은 건너뛰었습니다</p>
          {scrum.skip_reason && (
            <p className="text-muted-foreground mt-1">사유: {scrum.skip_reason}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (currentStatus === "completed") {
    return (
      <>
        <ScrumSummary
          scrumId={scrum.id}
          items={localItems}
          onReview={() => setShowReview(true)}
          onEdit={() => handleStepChange("brainstorming")}
        />
        {showReview && (
          <ScrumReview
            scrumId={scrum.id}
            items={localItems}
            onClose={() => setShowReview(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <ScrumStepper currentStatus={currentStatus} />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setShowSkipDialog(true)}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">건너뛰기</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(currentStatus === "not_started" || currentStatus === "brainstorming") && (
            <ScrumBrainstorm
              scrumId={scrum.id}
              items={localItems}
              carryOverItems={carryOverItems}
              dueSoonTasks={dueSoonTasks}
              todaySchedules={todaySchedules}
              userName={userName}
              conversation={scrum.ai_conversation}
              onItemsChange={handleItemsChange}
              onNext={() => handleStepChange("prioritizing")}
              onStart={() => {
                if (currentStatus === "not_started") {
                  handleStepChange("brainstorming");
                }
              }}
            />
          )}
          {currentStatus === "prioritizing" && (
            <ScrumPrioritize
              scrumId={scrum.id}
              items={localItems}
              onItemsChange={handleItemsChange}
              onPrev={() => handleStepChange("brainstorming")}
              onNext={() => handleStepChange("scheduling")}
            />
          )}
          {currentStatus === "scheduling" && (
            <ScrumSchedule
              scrumId={scrum.id}
              items={localItems}
              todaySchedules={todaySchedules}
              onItemsChange={handleItemsChange}
              onPrev={() => handleStepChange("prioritizing")}
            />
          )}
        </CardContent>
      </Card>

      <ScrumSkipDialog
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
        scrumId={scrum.id}
        onSkipped={() => setCurrentStatus("skipped")}
      />
    </div>
  );
}

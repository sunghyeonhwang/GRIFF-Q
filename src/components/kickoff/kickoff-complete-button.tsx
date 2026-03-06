"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, Rocket } from "lucide-react";
import { completeKickoff } from "@/actions/kickoff";
import { toast } from "sonner";
import type { KickoffStatus } from "@/types/kickoff.types";

interface KickoffCompleteButtonProps {
  kickoffId: string;
  allCompleted: boolean;
  status: KickoffStatus;
  projectId: string;
}

export function KickoffCompleteButton({
  kickoffId,
  allCompleted,
  status,
  projectId,
}: KickoffCompleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
        <CheckCircle2 className="size-5 text-green-600" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          킥오프가 완료되었습니다
        </span>
        <Badge variant="default" className="ml-auto bg-green-600">완료</Badge>
      </div>
    );
  }

  function handleComplete() {
    startTransition(async () => {
      try {
        await completeKickoff(kickoffId);
        toast.success("킥오프가 완료되었습니다! 이제 태스크를 생성할 수 있습니다.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "킥오프 완료에 실패했습니다.");
      }
    });
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              size="lg"
              className="w-full"
              disabled={!allCompleted || isPending}
              onClick={handleComplete}
            >
              <Rocket className="size-4 mr-2" />
              킥오프 완료
            </Button>
          </div>
        </TooltipTrigger>
        {!allCompleted && (
          <TooltipContent>
            모든 체크리스트를 완료해주세요
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

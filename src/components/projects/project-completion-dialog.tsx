"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquareText, ArrowRight } from "lucide-react";

interface ProjectCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectType: string; // "project" | "mini" | "self"
}

export function ProjectCompletionDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectType,
}: ProjectCompletionDialogProps) {
  const router = useRouter();

  const showRetroPrompt = projectType === "project" || projectType === "mini";
  const isRequired = projectType === "project";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로젝트 완료</DialogTitle>
          <DialogDescription>
            &quot;{projectName}&quot; 프로젝트가 완료되었습니다.
          </DialogDescription>
        </DialogHeader>

        {showRetroPrompt ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <MessageSquareText className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-medium">
                  {isRequired ? "회고를 작성해주세요" : "회고를 작성하시겠습니까?"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRequired
                    ? "프로젝트 완료 시 회고 작성이 필요합니다."
                    : "프로젝트 경험을 기록하면 다음 프로젝트에 도움이 됩니다."}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              {!isRequired && (
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  나중에
                </Button>
              )}
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push(
                    `/retrospective/postmortem?projectId=${projectId}`
                  );
                }}
              >
                <MessageSquareText className="h-4 w-4 mr-1" />
                회고 작성하기
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              셀프 프로젝트는 결과보고로 대체됩니다.
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>확인</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

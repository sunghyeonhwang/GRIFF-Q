"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rocket, Bot, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import {
  KICKOFF_STATUS_LABELS,
  KICKOFF_STATUS_VARIANTS,
  KICKOFF_CTA_CONFIG,
  KICKOFF_SECONDARY_CTA,
  type ProjectKickoff,
  type KickoffChecklistItem,
  type KickoffAcknowledgment,
  type KickoffAiConversation,
  type KickoffStatus,
} from "@/lib/kickoff-constants";

import { KickoffProgress } from "@/components/kickoff/kickoff-progress";
import { KickoffOverview } from "@/components/kickoff/kickoff-overview";
import { KickoffTeam } from "@/components/kickoff/kickoff-team";
import { KickoffMilestones } from "@/components/kickoff/kickoff-milestones";
import { KickoffChecklist } from "@/components/kickoff/kickoff-checklist";
import { KickoffNotes } from "@/components/kickoff/kickoff-notes";
import { KickoffAiPanel } from "@/components/kickoff/kickoff-ai-panel";
import { ProjectEditDialog } from "@/components/projects/project-edit-dialog";

interface KickoffPageLayoutProps {
  project: {
    id: string;
    name: string;
    status: string;
    lead_user_id: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  };
  kickoff: ProjectKickoff | null;
  checklistItems: KickoffChecklistItem[];
  acknowledgments: (KickoffAcknowledgment & { users?: { name: string } })[];
  aiConversation: KickoffAiConversation | null;
  users: { id: string; name: string }[];
  currentUser: { id: string; name?: string };
}

export function KickoffPageLayout({
  project,
  kickoff: initialKickoff,
  checklistItems: initialChecklist,
  acknowledgments: initialAcknowledgments,
  aiConversation: initialAiConversation,
  users,
  currentUser,
}: KickoffPageLayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [kickoff, setKickoff] = useState(initialKickoff);
  const [checklistItems, setChecklistItems] = useState(initialChecklist);
  const [acknowledgments, setAcknowledgments] = useState(
    initialAcknowledgments
  );
  const [aiConversation, setAiConversation] = useState(initialAiConversation);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState<string | undefined>();

  const handleAiAnalyze = useCallback((sectionName: string) => {
    setAiInitialMessage(`"${sectionName}" 섹션을 분석해주세요.`);
    setAiSheetOpen(true);
  }, []);

  const isPM = project.lead_user_id === currentUser.id || kickoff?.created_by === currentUser.id;
  const hasAcknowledged = acknowledgments.some(
    (a) => a.user_id === currentUser.id
  );

  // --- Data refresh ---
  const refreshData = useCallback(async () => {
    if (!kickoff) return;

    const [checklistRes, ackRes, aiRes] = await Promise.all([
      supabase
        .from("kickoff_checklist_items")
        .select("*")
        .eq("kickoff_id", kickoff.id)
        .order("sort_order"),
      supabase
        .from("kickoff_acknowledgments")
        .select("*, users!kickoff_acknowledgments_user_id_fkey(name)")
        .eq("kickoff_id", kickoff.id),
      supabase
        .from("kickoff_ai_conversations")
        .select("*")
        .eq("kickoff_id", kickoff.id)
        .eq("user_id", currentUser.id)
        .single(),
    ]);

    setChecklistItems(checklistRes.data ?? []);
    setAcknowledgments(ackRes.data ?? []);
    setAiConversation(aiRes.data);
  }, [kickoff, currentUser.id, supabase]);

  const onKickoffUpdate = useCallback(async () => {
    if (!kickoff) return;
    const { data } = await supabase
      .from("project_kickoffs")
      .select("*")
      .eq("id", kickoff.id)
      .single();
    if (data) setKickoff(data);
  }, [kickoff, supabase]);

  const onChecklistUpdate = useCallback(async () => {
    if (!kickoff) return;
    const { data } = await supabase
      .from("kickoff_checklist_items")
      .select("*")
      .eq("kickoff_id", kickoff.id)
      .order("sort_order");
    setChecklistItems(data ?? []);
  }, [kickoff, supabase]);

  const onAcknowledge = useCallback(async () => {
    if (!kickoff || hasAcknowledged) return;
    const { error } = await supabase.from("kickoff_acknowledgments").insert({
      kickoff_id: kickoff.id,
      user_id: currentUser.id,
    });
    if (error) {
      toast.error("확인 서명에 실패했습니다");
      return;
    }

    // Notify PM
    if (project.lead_user_id && project.lead_user_id !== currentUser.id) {
      const userName = users.find((u) => u.id === currentUser.id)?.name ?? "팀원";
      await supabase.from("notifications").insert({
        user_id: project.lead_user_id,
        type: "kickoff_acknowledged",
        title: "킥오프 숙지 확인",
        message: `${userName}님이 "${project.name}" 킥오프를 숙지했습니다.`,
        link: `/projects/${project.id}/kickoff`,
      });
    }

    toast.success("킥오프를 확인했습니다");
    await refreshData();
  }, [kickoff, hasAcknowledged, currentUser.id, supabase, refreshData]);

  // --- Create draft kickoff ---
  const createDraftKickoff = async () => {
    const { data, error } = await supabase
      .from("project_kickoffs")
      .insert({
        project_id: project.id,
        status: "draft",
        created_by: currentUser.id,
        objective: "",
        scope: "",
        constraints: "",
        success_criteria: "",
        notes: "",
      })
      .select()
      .single();

    if (error) {
      toast.error("킥오프 생성에 실패했습니다");
      return;
    }
    toast.success("킥오프 초안이 생성되었습니다");
    setKickoff(data);
    startTransition(() => router.refresh());
  };

  // --- Status transition ---
  const handleStatusTransition = async () => {
    if (!kickoff) return;
    const cta = KICKOFF_CTA_CONFIG[kickoff.status];
    if (!cta.nextStatus) return;

    // completed→in_progress: only PM can do this
    if (
      kickoff.status === "completed" &&
      cta.nextStatus === "in_progress" &&
      !isPM
    ) {
      toast.error("PM만 킥오프를 재개할 수 있습니다");
      return;
    }

    // in_progress→completed: warn if incomplete
    if (kickoff.status === "in_progress" && cta.nextStatus === "completed") {
      const unchecked = checklistItems.filter((item) => !item.is_completed);
      const unacknowledged = users.filter(
        (u) => !acknowledgments.some((a) => a.user_id === u.id)
      );
      if (unchecked.length > 0 || unacknowledged.length > 0) {
        setShowIncompleteWarning(true);
        return;
      }
    }

    await executeStatusTransition(cta.nextStatus);
  };

  const executeStatusTransition = async (nextStatus: KickoffStatus) => {
    if (!kickoff) return;

    const updates: Record<string, any> = { status: nextStatus };
    if (nextStatus === "in_progress" && !kickoff.kickoff_date) {
      updates.kickoff_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("project_kickoffs")
      .update(updates)
      .eq("id", kickoff.id);

    if (error) {
      toast.error("상태 변경에 실패했습니다");
      return;
    }

    // Notify team members on status transitions
    if (nextStatus === "in_progress") {
      // PM auto-acknowledge
      await supabase.from("kickoff_acknowledgments").upsert({
        kickoff_id: kickoff.id,
        user_id: currentUser.id,
      }, { onConflict: "kickoff_id,user_id" });

      // Notify all team members
      const notifRows = users
        .filter((u) => u.id !== currentUser.id)
        .map((u) => ({
          user_id: u.id,
          type: "kickoff_started",
          title: "킥오프 시작",
          message: `"${project.name}" 프로젝트 킥오프가 시작되었습니다. 확인 후 숙지 서명을 해주세요.`,
          link: `/projects/${project.id}/kickoff`,
        }));
      if (notifRows.length > 0) {
        await supabase.from("notifications").insert(notifRows);
      }
    }

    const statusLabel =
      KICKOFF_STATUS_LABELS[nextStatus as KickoffStatus] ?? nextStatus;
    toast.success(`킥오프 상태: ${statusLabel}`);
    setShowIncompleteWarning(false);
    await onKickoffUpdate();
    await refreshData();
    startTransition(() => router.refresh());
  };

  // --- Empty state ---
  if (!kickoff) {
    return (
      <div className="space-y-6">
        <Header project={project} users={users} />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Rocket className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            아직 킥오프가 설정되지 않았습니다
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            킥오프를 설정하면 프로젝트 목표, 범위, 체크리스트를 정의하고 팀원과
            공유할 수 있습니다.
          </p>
          <Button onClick={createDraftKickoff} disabled={isPending}>
            <Rocket className="mr-2 size-4" />
            킥오프 설정하기
          </Button>
        </div>
      </div>
    );
  }

  const ctaConfig = KICKOFF_CTA_CONFIG[kickoff.status];
  const secondaryCta = KICKOFF_SECONDARY_CTA[kickoff.status];

  return (
    <div className="flex gap-6 relative">
      {/* Main content — shrinks when AI panel opens */}
      <div
        className="min-w-0 space-y-6 transition-all duration-300 ease-in-out"
        style={{ flex: aiSheetOpen ? "1 1 0%" : "1 1 100%" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <Header project={project} kickoff={kickoff} users={users} />
          <div className="flex items-center gap-2">
            {secondaryCta && isPM && (
              <Button
                variant={secondaryCta.variant}
                onClick={() => executeStatusTransition(secondaryCta.nextStatus)}
                disabled={isPending}
              >
                {secondaryCta.label}
              </Button>
            )}
            <Button
              variant={ctaConfig.variant}
              onClick={handleStatusTransition}
              disabled={isPending}
            >
              <Rocket className="mr-2 size-4" />
              {ctaConfig.label}
            </Button>
          </div>
        </div>

        <KickoffProgress
          checklistItems={checklistItems}
          acknowledgments={acknowledgments}
          totalMembers={users.length}
        />
        <KickoffOverview
          kickoff={kickoff}
          onUpdate={async (updates) => {
            const { error } = await supabase
              .from("project_kickoffs")
              .update(updates)
              .eq("id", kickoff.id)
              .eq("updated_at", kickoff.updated_at);
            if (error) {
              if (error.message.includes("0 rows")) {
                toast.error("다른 사용자가 수정했습니다. 새로고침 후 다시 시도하세요.");
              } else {
                toast.error("저장 실패");
              }
              throw error;
            }
            await onKickoffUpdate();
          }}
          isPM={isPM}
        />
        <KickoffTeam
          kickoff={kickoff}
          users={users}
          acknowledgments={acknowledgments}
          currentUserId={currentUser.id}
          isPM={isPM}
          onAcknowledge={onAcknowledge}
        />
        <KickoffMilestones
          project={project}
          kickoffDate={kickoff.kickoff_date}
        />
        <KickoffChecklist
          kickoff={kickoff}
          items={checklistItems}
          users={users}
          currentUserId={currentUser.id}
          onUpdate={onChecklistUpdate}
          isPM={isPM}
        />
        <KickoffNotes
          kickoff={kickoff}
          onUpdate={async (notes) => {
            const { error } = await supabase
              .from("project_kickoffs")
              .update({ notes })
              .eq("id", kickoff.id);
            if (error) throw error;
            await onKickoffUpdate();
          }}
          isPM={isPM}
        />
      </div>

      {/* AI side panel — inline, not overlay */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${
          aiSheetOpen ? "w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="sticky top-4 z-10 h-[calc(100vh-6rem)] w-[420px] border rounded-lg bg-background flex flex-col">
          {/* Panel close button */}
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => {
                setAiSheetOpen(false);
                setAiInitialMessage(undefined);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
          <KickoffAiPanel
            kickoff={kickoff}
            project={project}
            checklistItems={checklistItems}
            aiConversation={aiConversation}
            currentUser={currentUser}
            onChecklistUpdate={onChecklistUpdate}
            onKickoffUpdate={onKickoffUpdate}
            initialMessage={aiInitialMessage}
            isVisible={aiSheetOpen}
          />
        </div>
      </div>

      {/* Mobile: AI panel as bottom fixed overlay */}
      {aiSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="flex-1 bg-black/40"
            onClick={() => {
              setAiSheetOpen(false);
              setAiInitialMessage(undefined);
            }}
          />
          <div className="h-[80vh] bg-background border-t rounded-t-xl">
            <div className="absolute top-2 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => {
                  setAiSheetOpen(false);
                  setAiInitialMessage(undefined);
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
            <KickoffAiPanel
              kickoff={kickoff}
              project={project}
              checklistItems={checklistItems}
              aiConversation={aiConversation}
              currentUser={currentUser}
              onChecklistUpdate={onChecklistUpdate}
              onKickoffUpdate={onKickoffUpdate}
              initialMessage={aiInitialMessage}
            />
          </div>
        </div>
      )}

      {/* Floating AI button */}
      {!aiSheetOpen && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            size="icon"
            className="size-12 rounded-full shadow-lg"
            onClick={() => {
              setAiInitialMessage(undefined);
              setAiSheetOpen(true);
            }}
          >
            <Bot className="size-5" />
          </Button>
        </div>
      )}

      {/* Bottom sticky: Acknowledge button */}
      {!isPM && !hasAcknowledged && kickoff.status !== "draft" && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 md:pl-[var(--sidebar-width)]">
          <div className="mx-auto max-w-screen-xl flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              킥오프 내용을 확인하고 서명해주세요
            </p>
            <Button onClick={onAcknowledge} disabled={isPending}>
              확인 서명
            </Button>
          </div>
        </div>
      )}

      {/* Incomplete warning dialog */}
      <AlertDialog
        open={showIncompleteWarning}
        onOpenChange={setShowIncompleteWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>미완료 항목이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const unchecked = checklistItems.filter(
                  (item) => !item.is_completed
                );
                const unacknowledged = users.filter(
                  (u) => !acknowledgments.some((a) => a.user_id === u.id)
                );
                const parts: string[] = [];
                if (unchecked.length > 0)
                  parts.push(`체크리스트 ${unchecked.length}개 미완료`);
                if (unacknowledged.length > 0)
                  parts.push(`팀원 ${unacknowledged.length}명 미확인`);
                return `${parts.join(", ")}. 그래도 킥오프를 완료하시겠습니까?`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeStatusTransition("completed")}
            >
              완료 처리
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Header sub-component ---
function Header({
  project,
  kickoff,
  users,
}: {
  project: { id: string; name: string; status: string; lead_user_id: string | null; start_date: string | null; end_date: string | null; description: string | null };
  kickoff?: ProjectKickoff | null;
  users?: { id: string; name: string }[];
}) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/projects/${project.id}`}>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="size-4" />
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {users && (
          <ProjectEditDialog project={project} users={users} />
        )}
        {kickoff && (
          <Badge variant={KICKOFF_STATUS_VARIANTS[kickoff.status]}>
            {KICKOFF_STATUS_LABELS[kickoff.status]}
          </Badge>
        )}
      </div>
    </div>
  );
}

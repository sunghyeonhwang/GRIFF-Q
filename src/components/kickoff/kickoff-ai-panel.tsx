"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { Bot, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type {
  ProjectKickoff,
  KickoffChecklistItem,
  KickoffAiConversation,
  AiSuggestion,
  AiRisk,
} from "@/lib/kickoff-constants";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: AiSuggestion[];
  risks?: AiRisk[];
}

interface KickoffAiPanelProps {
  kickoff: ProjectKickoff;
  project: {
    id: string;
    name: string;
    status: string;
    lead_user_id: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  };
  checklistItems: KickoffChecklistItem[];
  aiConversation: KickoffAiConversation | null;
  currentUser: { id: string; name?: string };
  onChecklistUpdate: () => Promise<void>;
  onKickoffUpdate: () => Promise<void>;
  initialMessage?: string;
  isVisible?: boolean;
}

const RISK_BADGE_VARIANT: Record<string, "destructive" | "outline" | "secondary"> = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
};

const RISK_LEVEL_LABEL: Record<string, string> = {
  high: "높음",
  medium: "중간",
  low: "낮음",
};

export function KickoffAiPanel({
  kickoff,
  project,
  checklistItems,
  aiConversation,
  currentUser,
  onChecklistUpdate,
  onKickoffUpdate,
  initialMessage,
  isVisible = true,
}: KickoffAiPanelProps) {
  const supabase = createClient();
  const isPM = project.lead_user_id === currentUser.id;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (aiConversation?.messages) {
      return aiConversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [_isMinimized, _setIsMinimized] = useState(false);
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const riskAnalyzedRef = useRef(false);
  const objectiveRef = useRef(kickoff.objective);
  const overviewAnalyzedRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-trigger: analyze_risks on first visible
  useEffect(() => {
    if (!isVisible) return;
    if (riskAnalyzedRef.current) return;
    riskAnalyzedRef.current = true;
    callAI("analyze_risks");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Auto-trigger: initialMessage from section Zap button
  const initialMessageRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!initialMessage || initialMessage === initialMessageRef.current) return;
    initialMessageRef.current = initialMessage;
    addMessage("user", initialMessage);
    callAI("chat", initialMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  // Auto-trigger: analyze_overview when objective changes
  useEffect(() => {
    if (kickoff.objective === objectiveRef.current) return;
    if (!kickoff.objective) return;
    objectiveRef.current = kickoff.objective;
    if (overviewAnalyzedRef.current) return;
    overviewAnalyzedRef.current = true;
    callAI("analyze_overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kickoff.objective]);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string, suggestions?: AiSuggestion[], risks?: AiRisk[]) => {
      setMessages((prev) => [
        ...prev,
        {
          role,
          content,
          timestamp: new Date().toISOString(),
          suggestions,
          risks,
        },
      ]);
    },
    []
  );

  const callAI = async (action: string, userMessage?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/kickoff/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          kickoffId: kickoff.id,
          action,
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "API error");
      }
      addMessage("assistant", data.reply, data.suggestions, data.risks);
    } catch {
      addMessage("assistant", "AI 응답을 가져올 수 없습니다. 다시 시도해주세요.");
      toast.error("AI 응답을 가져올 수 없습니다");
    }
    setIsLoading(false);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    addMessage("user", trimmed);
    setInput("");
    callAI("chat", trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAction = async (suggestion: AiSuggestion, msgIndex: number) => {
    const actionKey = `${msgIndex}-${suggestion.label}`;
    if (appliedActions.has(actionKey)) return;

    if (suggestion.action === "add_checklist") {
      const items = Array.isArray(suggestion.data) ? suggestion.data : [];
      const maxOrder = checklistItems.length > 0
        ? Math.max(...checklistItems.map((c) => c.sort_order))
        : 0;

      const inserts = items.map((item: { title: string; description?: string; assignee_id?: string; due_date?: string }, i: number) => ({
        kickoff_id: kickoff.id,
        title: item.title,
        description: item.description || "",
        assignee_id: item.assignee_id || null,
        due_date: item.due_date || null,
        sort_order: maxOrder + i + 1,
        is_auto_generated: true,
      }));

      const { error } = await supabase.from("kickoff_checklist_items").insert(inserts);
      if (error) {
        toast.error("체크리스트 추가에 실패했습니다");
        return;
      }
      toast.success(`체크리스트 ${items.length}개 항목이 추가되었습니다`);
      await onChecklistUpdate();
    } else if (suggestion.action === "add_notes") {
      const noteText = typeof suggestion.data === "string" ? suggestion.data : JSON.stringify(suggestion.data);
      const separator = kickoff.notes ? "\n\n---\n\n" : "";
      const { error } = await supabase
        .from("project_kickoffs")
        .update({ notes: kickoff.notes + separator + noteText })
        .eq("id", kickoff.id);

      if (error) {
        toast.error("비고 추가에 실패했습니다");
        return;
      }
      toast.success("비고에 내용이 추가되었습니다");
      await onKickoffUpdate();
    } else if (suggestion.action === "create_tasks") {
      toast.info("Task 생성은 Phase B2에서 구현됩니다");
    } else {
      // ignore
    }

    setAppliedActions((prev) => new Set(prev).add(actionKey));
  };

  const handleRetry = (msgIndex: number) => {
    // Find the user message before this failed AI message
    const prevUserMsg = [...messages].slice(0, msgIndex).reverse().find((m) => m.role === "user");
    setMessages((prev) => prev.filter((_, i) => i !== msgIndex));
    if (prevUserMsg) {
      callAI("chat", prevUserMsg.content);
    } else {
      callAI("analyze_risks");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <span className="font-medium text-sm">AI 킥오프 어시스턴트</span>
        </div>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="size-8 mb-2 opacity-50" />
            <p className="text-sm">AI 어시스턴트가 프로젝트를 분석 중입니다...</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={msg.role === "user"
              ? "bg-primary text-primary-foreground rounded-lg p-3 max-w-[85%]"
              : "bg-muted rounded-lg p-3 max-w-[85%]"
            }>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Bot className="size-3.5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">AI</span>
                </div>
              )}

              {/* Message content */}
              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {msg.content}
              </div>

              {/* Risks display */}
              {msg.risks && msg.risks.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">식별된 리스크:</p>
                  {msg.risks.map((risk, ri) => (
                    <div key={ri} className="border rounded p-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={RISK_BADGE_VARIANT[risk.level] ?? "outline"} className="text-[10px] px-1.5 py-0">
                          {RISK_LEVEL_LABEL[risk.level] ?? risk.level}
                        </Badge>
                        <span className="text-sm font-medium">{risk.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{risk.description}</p>
                      <p className="text-xs"><span className="font-medium">권장:</span> {risk.recommendation}</p>
                      {risk.source_project && (
                        <p className="text-[10px] text-muted-foreground">출처: {risk.source_project}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons (PM only) */}
              {isPM && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {msg.suggestions.map((suggestion, si) => {
                    const actionKey = `${idx}-${suggestion.label}`;
                    const isApplied = appliedActions.has(actionKey);
                    if (suggestion.action === "ignore") return null;
                    return (
                      <Button
                        key={si}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        disabled={isApplied}
                        onClick={() => handleAction(suggestion, idx)}
                      >
                        {isApplied ? "반영됨" : suggestion.label}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Retry button for error messages */}
              {msg.role === "assistant" && msg.content.includes("다시 시도해주세요") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs h-7 gap-1"
                  onClick={() => handleRetry(idx)}
                >
                  <RefreshCw className="size-3" />
                  다시 시도
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Bot className="size-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">AI</span>
              </div>
              <div className="flex gap-1 items-center h-5">
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex gap-2 shrink-0">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="킥오프에 대해 질문하세요..."
          disabled={isLoading}
          className="min-h-[40px] max-h-[120px] resize-none text-sm"
          rows={1}
        />
        <Button
          size="icon"
          className="shrink-0 size-10"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

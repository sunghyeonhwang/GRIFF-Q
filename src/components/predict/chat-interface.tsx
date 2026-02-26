"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  UserRound,
  Briefcase,
  Building,
  Crown,
  Shield,
  Star,
  Heart,
  Send,
  Plus,
  MessageSquare,
  ArrowLeft,
  Lightbulb,
  PhoneIncoming,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { SentimentGauge } from "@/components/predict/sentiment-gauge";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  "user-round": UserRound,
  briefcase: Briefcase,
  building: Building,
  crown: Crown,
  shield: Shield,
  star: Star,
  heart: Heart,
};

interface Suggestion {
  text: string;
  expected: "positive" | "neutral" | "negative";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sentiment?: "positive" | "neutral" | "negative";
  warning?: string | null;
  suggestions?: Suggestion[];
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatInterfaceProps {
  avatar: any;
  sessions: ChatSession[];
}

const SIMULATION_SCENARIOS = [
  { value: "none", label: "시뮬레이션 없음" },
  { value: "견적 네고", label: "견적 네고" },
  { value: "일정 변경", label: "일정 변경" },
  { value: "불만 접수", label: "불만 접수" },
  { value: "추가 요청", label: "추가 요청" },
  { value: "custom", label: "커스텀" },
];

export function ChatInterface({ avatar, sessions: initialSessions }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulationMode, setSimulationMode] = useState("none");
  const [customScenario, setCustomScenario] = useState("");
  const [initiateContext, setInitiateContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const IconComponent = ICON_MAP[avatar.icon] ?? User;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadSession(sessionId: string) {
    const supabase = createClient();
    const { data: chatMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (chatMessages) {
      setMessages(
        chatMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }
    setCurrentSessionId(sessionId);
  }

  function startNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
  }

  async function deleteSession(sessionId: string) {
    const supabase = createClient();
    await supabase.from("chat_messages").delete().eq("session_id", sessionId);
    await supabase.from("chat_sessions").delete().eq("id", sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  }

  function getActiveScenario(): string | undefined {
    if (simulationMode === "none") return undefined;
    if (simulationMode === "custom") return customScenario || undefined;
    return simulationMode;
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        avatarId: avatar.id,
        sessionId: currentSessionId,
        message: trimmed,
        history: messages.map(({ role, content }) => ({ role, content })),
      };

      const scenario = getActiveScenario();
      if (scenario) {
        body.simulationScenario = scenario;
      }

      const res = await fetch("/api/predict/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: data.error || "오류가 발생했습니다." },
        ]);
        return;
      }

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.reply,
          sentiment: data.sentiment,
          warning: data.warning,
          suggestions: data.suggestions,
        },
      ]);

      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        const isIncoming = messages.length > 0 && messages[0].role === "assistant";
        const title = isIncoming
          ? `[수신] ${messages[0].content.replace(/<br\s*\/?>/gi, " ").slice(0, 40)}`
          : trimmed.slice(0, 50);
        setSessions((prev) => [
          { id: data.sessionId, title, created_at: new Date().toISOString() },
          ...prev,
        ]);
      }
    } catch {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "네트워크 오류가 발생했습니다." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function initiateChat() {
    const text = initiateContext.trim();
    if (!text) return;
    setMessages([{ role: "assistant", content: text }]);
    setInitiateContext("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const EXPECTED_CONFIG = {
    positive: { label: "긍정 예상", variant: "default" as const, icon: "^" },
    neutral: { label: "중립 예상", variant: "secondary" as const, icon: "-" },
    negative: { label: "부정 예상", variant: "destructive" as const, icon: "v" },
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      {/* Sidebar */}
      <Card className="flex w-full md:w-72 shrink-0 flex-col overflow-hidden max-h-48 md:max-h-none">
        <div className="border-b p-3">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/predict/avatars">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted shrink-0">
                <IconComponent className="size-4" />
              </div>
              <span className="font-medium text-sm truncate">{avatar.name}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={startNewChat}
          >
            <Plus className="mr-1 size-3" />
            새 대화
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted cursor-pointer ${
                  currentSessionId === session.id
                    ? "bg-muted font-medium"
                    : ""
                }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 break-all flex-1 text-xs">{session.title}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString("ko-KR")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="shrink-0 size-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                대화 기록이 없습니다.
              </p>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat area */}
      <Card className="flex flex-1 flex-col overflow-hidden min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0 p-4">
          <div className="space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                  <IconComponent className="size-8" />
                </div>
                <p className="text-lg font-medium">{avatar.name}</p>
                <p className="text-sm mt-1">
                  {[avatar.company, avatar.position].filter(Boolean).join(" / ")}
                </p>
                {avatar.personality_tags && avatar.personality_tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {avatar.personality_tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-lg">
                  <p className="text-sm">메시지를 입력하거나, 아바타가 먼저 보낼 메시지를 작성하세요.</p>
                  <div className="w-full space-y-2">
                    <Input
                      value={initiateContext}
                      onChange={(e) => setInitiateContext(e.target.value)}
                      placeholder={`${avatar.name}이(가) 보낼 메시지 (예: 견적서 확인하셨나요? 회신 부탁드립니다)`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          initiateChat();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={initiateChat}
                      disabled={!initiateContext.trim()}
                      className="w-full gap-2"
                    >
                      <PhoneIncoming className="size-4" />
                      {avatar.name}이(가) 먼저 말 걸기
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className={`max-w-[70%] space-y-1`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex size-5 items-center justify-center rounded-full bg-muted">
                        <IconComponent className="size-3" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {avatar.name}
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content.replace(/<br\s*\/?>/gi, "\n")}
                  </div>
                  {/* Sentiment gauge for assistant messages */}
                  {msg.role === "assistant" && msg.sentiment && (
                    <div className="mt-1.5 ml-1">
                      <SentimentGauge
                        sentiment={msg.sentiment}
                        warning={msg.warning}
                      />
                    </div>
                  )}
                  {/* Context-aware response suggestions by expected reaction */}
                  {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 ml-1 space-y-1.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lightbulb className="size-3" />
                        <span>대응 제안 (예상 반응별)</span>
                      </div>
                      <div className="space-y-1">
                        {msg.suggestions.map((suggestion, i) => {
                          const config = EXPECTED_CONFIG[suggestion.expected] ?? EXPECTED_CONFIG.neutral;
                          return (
                            <button
                              key={i}
                              onClick={() => setInput(suggestion.text)}
                              className="flex w-full items-start gap-2 rounded-md border bg-background px-2.5 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                            >
                              <Badge
                                variant={config.variant}
                                className="shrink-0 text-[10px] px-1.5 py-0"
                              >
                                {config.label}
                              </Badge>
                              <span className="leading-relaxed">{suggestion.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[70%] space-y-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="flex size-5 items-center justify-center rounded-full bg-muted">
                      <IconComponent className="size-3" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {avatar.name}
                    </span>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    응답 생성 중...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="shrink-0 border-t p-4 space-y-3">
          {/* Simulation mode selector */}
          <div className="flex items-center gap-2">
            <Select value={simulationMode} onValueChange={setSimulationMode}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="시뮬레이션 모드" />
              </SelectTrigger>
              <SelectContent>
                {SIMULATION_SCENARIOS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {simulationMode === "custom" && (
              <Input
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="커스텀 시나리오 입력..."
                className="flex-1"
              />
            )}
            {simulationMode !== "none" && (
              <Badge variant="secondary" className="shrink-0">
                시뮬레이션
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="icon"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

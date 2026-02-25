"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import Link from "next/link";

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

interface Message {
  role: "user" | "assistant";
  content: string;
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

export function ChatInterface({ avatar, sessions: initialSessions }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/predict/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId: avatar.id,
          sessionId: currentSessionId,
          message: trimmed,
          history: messages,
        }),
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
        { role: "assistant", content: data.reply },
      ]);

      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        setSessions((prev) => [
          { id: data.sessionId, title: trimmed.slice(0, 50), created_at: new Date().toISOString() },
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <Card className="flex w-64 shrink-0 flex-col">
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
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  currentSessionId === session.id
                    ? "bg-muted font-medium"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{session.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(session.created_at).toLocaleDateString("ko-KR")}
                </p>
              </button>
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
      <Card className="flex flex-1 flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
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
                <p className="text-sm mt-4">메시지를 입력하여 대화를 시작하세요.</p>
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
                    {msg.content}
                  </div>
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
        <div className="border-t p-4">
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

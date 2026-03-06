"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiMessage } from "@/types/scrum.types";
import { saveScrumConversation } from "@/actions/scrum";

interface ScrumAiChatProps {
  scrumId: string;
  initialConversation: AiMessage[];
  context: {
    userName: string;
    carryOverItems: { title: string }[];
    dueSoonTasks: { title: string; due_date: string }[];
    todaySchedules: { title: string; start_time: string; end_time: string }[];
  };
  onExtractItems?: (text: string) => void;
}

export function ScrumAiChat({
  scrumId,
  initialConversation,
  context,
  onExtractItems,
}: ScrumAiChatProps) {
  const [messages, setMessages] = useState<AiMessage[]>(initialConversation);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: AiMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/scrum/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversation: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }),
      });

      if (!res.ok) {
        let errorMsg = "AI 요청 실패";
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          errorMsg = `AI 서버 오류 (${res.status})`;
        }
        throw new Error(errorMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림 없음");

      let assistantText = "";
      const decoder = new TextDecoder();

      const assistantMsg: AiMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: assistantText,
                };
                return next;
              });
            }
          } catch {
            // skip parse errors
          }
        }
      }

      const finalMessages: AiMessage[] = [
        ...updatedMessages,
        { role: "assistant", content: assistantText, timestamp: new Date().toISOString() },
      ];
      setMessages(finalMessages);

      await saveScrumConversation(
        scrumId,
        finalMessages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }))
      );

      if (onExtractItems) {
        onExtractItems(assistantText);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ""),
        {
          role: "assistant",
          content: `오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, context, scrumId, onExtractItems]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto rounded-lg border bg-background p-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Bot className="h-4 w-4" />
            <span>AI에게 오늘 할 일을 말해보세요!</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.content || (isStreaming && i === messages.length - 1 ? "..." : "")}
            </div>
            {msg.role === "user" && (
              <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="오늘 할 일을 말해보세요..."
          className="min-h-[40px] max-h-[120px] resize-none"
          rows={1}
          disabled={isStreaming}
        />
        <Button
          size="icon"
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

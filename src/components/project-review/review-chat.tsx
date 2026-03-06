"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { ReviewChatMessage } from "./review-chat-message";
import type { ChatMessage } from "@/types/review.types";

interface ReviewChatProps {
  projectId: string;
  initialMessages?: ChatMessage[];
  conversationId?: string | null;
}

const SUGGESTED_QUESTIONS = [
  "프로젝트 진행률은 어떤가요?",
  "지연된 Task가 있나요?",
  "리스크 요인은 무엇인가요?",
  "팀 업무 부하는 어떤가요?",
];

export function ReviewChat({
  projectId,
  initialMessages = [],
  conversationId: initialConvId = null,
}: ReviewChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [convId, setConvId] = useState<string | null>(initialConvId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  async function handleSend(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch(`/api/projects/${projectId}/review/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "요청 실패");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);

          try {
            const data = JSON.parse(jsonStr);
            if (data.error) throw new Error(data.error);
            if (data.done) {
              if (data.conversationId) setConvId(data.conversationId);
              break;
            }
            if (data.text) {
              fullContent += data.text;
              setStreamingContent(fullContent);
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: fullContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "오류가 발생했습니다.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `오류: ${errorMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
              <Send className="size-6" />
            </div>
            <h3 className="text-lg font-medium mb-2">AI 프로젝트 리뷰</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              프로젝트 데이터를 기반으로 AI와 대화하세요. 진행 상황, 리스크,
              팀 부하 등을 분석해드립니다.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg, idx) => (
              <ReviewChatMessage
                key={idx}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            {streamingContent && (
              <ReviewChatMessage
                role="assistant"
                content={streamingContent}
                isStreaming
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <Card className="mt-2 shrink-0">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="프로젝트에 대해 질문하세요..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

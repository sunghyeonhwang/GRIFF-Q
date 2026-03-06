"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ReviewChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export function ReviewChatMessage({
  role,
  content,
  timestamp,
  isStreaming,
}: ReviewChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex items-start">
          <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
            <Bot className="size-4" />
          </div>
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-text-bottom" />
        )}
        {timestamp && (
          <div
            className={cn(
              "text-xs mt-1.5 opacity-60",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {new Date(timestamp).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex items-start">
          <div className="p-1.5 rounded-full bg-muted shrink-0">
            <User className="size-4" />
          </div>
        </div>
      )}
    </div>
  );
}

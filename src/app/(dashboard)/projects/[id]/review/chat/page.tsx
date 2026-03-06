import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReviewChat } from "@/components/project-review/review-chat";
import type { ChatMessage } from "@/types/review.types";

export default async function ReviewChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conv?: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const { conv: convId } = await searchParams;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // 기존 대화 로드
  let initialMessages: ChatMessage[] = [];
  let initialConversationId: string | null = null;

  if (convId) {
    const { data: conv } = await supabase
      .from("project_review_conversations")
      .select("id, messages")
      .eq("id", convId)
      .eq("user_id", user.id)
      .single();

    if (conv) {
      initialMessages = (conv.messages as ChatMessage[]) ?? [];
      initialConversationId = conv.id;
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}/review`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">AI 대화</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project.name}
          </p>
        </div>
      </div>

      {/* Chat */}
      <ReviewChat
        projectId={id}
        initialMessages={initialMessages}
        conversationId={initialConversationId}
      />
    </div>
  );
}

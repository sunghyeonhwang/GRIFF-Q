import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/predict/chat-interface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ avatarId: string }>;
}) {
  await requireRole("manager");
  const { avatarId } = await params;
  const supabase = await createClient();

  const { data: avatar } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (!avatar) notFound();

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("avatar_id", avatarId)
    .order("created_at", { ascending: false })
    .limit(10);

  return <ChatInterface avatar={avatar} sessions={sessions ?? []} />;
}

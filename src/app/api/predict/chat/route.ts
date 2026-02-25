import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatarId, sessionId, message, history } = await req.json();

  // Get avatar profile
  const { data: avatar } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (!avatar)
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });

  // Build system prompt from avatar profile
  const systemPrompt = buildSystemPrompt(avatar);

  // Build conversation for Gemini
  const contents: { role: string; parts: { text: string }[] }[] = [];

  // Add history
  for (const msg of history || []) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current message
  contents.push({ role: "user", parts: [{ text: message }] });

  // Call Gemini API
  const geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  });

  const geminiData = await geminiRes.json();
  const reply =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
    "응답을 생성할 수 없습니다.";

  // Create or use session
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({
        avatar_id: avatarId,
        title: message.slice(0, 50),
        created_by: user.id,
      })
      .select("id")
      .single();
    activeSessionId = newSession?.id;
  }

  // Save messages
  if (activeSessionId) {
    await supabase.from("chat_messages").insert([
      { session_id: activeSessionId, role: "user", content: message },
      { session_id: activeSessionId, role: "assistant", content: reply },
    ]);
  }

  return NextResponse.json({ reply, sessionId: activeSessionId });
}

function buildSystemPrompt(avatar: any): string {
  const parts = [
    `당신은 "${avatar.name}"이라는 클라이언트 역할을 수행합니다.`,
    avatar.company ? `소속: ${avatar.company}` : "",
    avatar.position ? `직급/역할: ${avatar.position}` : "",
    avatar.tone_style ? `말투 스타일: ${avatar.tone_style}` : "",
    avatar.personality_tags?.length
      ? `성격 키워드: ${avatar.personality_tags.join(", ")}`
      : "",
    avatar.decision_pattern
      ? `의사결정 패턴: ${avatar.decision_pattern}`
      : "",
    avatar.sensitive_topics?.length
      ? `민감한 주제: ${avatar.sensitive_topics.join(", ")}`
      : "",
    avatar.memo ? `추가 정보: ${avatar.memo}` : "",
    "",
    "위 프로필에 맞게 이 클라이언트처럼 자연스럽게 응답하세요.",
    "한국어로 응답하세요.",
  ];
  return parts.filter(Boolean).join("\n");
}

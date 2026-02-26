import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatarId, sessionId, message, history, simulationScenario } =
    await req.json();

  // Get avatar profile
  const { data: avatar } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (!avatar)
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });

  // Build system prompt from avatar profile
  const systemPrompt = buildSystemPrompt(avatar, simulationScenario);

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
  const rawReply =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
    "응답을 생성할 수 없습니다.";

  // Parse structured response (JSON with reply, sentiment, warning, suggestions)
  let reply = rawReply;
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let warning: string | null = null;
  let suggestions: { text: string; expected: string }[] = [];

  const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.reply) {
        reply = parsed.reply;
        sentiment = parsed.sentiment || "neutral";
        warning = parsed.warning || null;
        suggestions = parsed.suggestions || [];
      }
    } catch {
      // JSON parsing failed, use raw text with neutral sentiment
    }
  }

  // Create or use session
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    // Determine title: if first message in history is from assistant, it's an incoming chat
    const isIncoming = history?.length > 0 && history[0].role === "assistant";
    const title = isIncoming
      ? `[수신] ${(history[0].content as string).slice(0, 40)}`
      : message.slice(0, 50);

    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({
        avatar_id: avatarId,
        title,
        created_by: user.id,
      })
      .select("id")
      .single();
    activeSessionId = newSession?.id;

    // Save history messages (e.g. avatar's initial message) when creating new session
    if (activeSessionId && history?.length > 0) {
      const historyRows = history.map((h: { role: string; content: string }) => ({
        session_id: activeSessionId,
        role: h.role === "user" ? "user" : "assistant",
        content: h.content,
      }));
      await supabase.from("chat_messages").insert(historyRows);
    }
  }

  // Save current exchange
  if (activeSessionId) {
    await supabase.from("chat_messages").insert([
      { session_id: activeSessionId, role: "user", content: message },
      { session_id: activeSessionId, role: "assistant", content: reply },
    ]);
  }

  return NextResponse.json({
    reply,
    sessionId: activeSessionId,
    sentiment,
    warning,
    suggestions,
  });
}

function buildSystemPrompt(
  avatar: any,
  simulationScenario?: string
): string {
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
    avatar.common_phrases?.length
      ? `자주 쓰는 표현: ${avatar.common_phrases.join(", ")}`
      : "",
    avatar.response_style ? `응답 스타일: ${avatar.response_style}` : "",
    avatar.emoji_usage ? `이모지 사용: ${avatar.emoji_usage}` : "",
    avatar.memo ? `추가 정보: ${avatar.memo}` : "",
  ];

  if (simulationScenario) {
    parts.push("");
    parts.push(`[시뮬레이션 시나리오] 현재 다음 상황을 시뮬레이션합니다: ${simulationScenario}`);
    parts.push("이 시나리오에 맞게 클라이언트 입장에서 반응하세요.");
  }

  parts.push("");
  parts.push("위 프로필에 맞게 이 클라이언트처럼 자연스럽게 응답하세요.");
  parts.push("한국어로 응답하세요.");
  parts.push("");
  parts.push(`응답은 반드시 다음 JSON 형식으로 해주세요:
{"reply": "실제 응답 내용", "sentiment": "positive|neutral|negative", "warning": "민감 주제 감지 시 경고 메시지 또는 null", "suggestions": [{"text": "대응 답변", "expected": "positive"}, {"text": "대응 답변", "expected": "neutral"}, {"text": "대응 답변", "expected": "negative"}]}

sentiment는 대화의 감정 톤을 나타냅니다. 클라이언트가 만족하거나 긍정적이면 positive, 불만이나 부정적이면 negative, 그 외는 neutral입니다.
warning은 민감한 주제(${avatar.sensitive_topics?.join(", ") || "없음"})가 감지되었을 때만 경고 메시지를 넣어주세요. 민감 주제가 아니면 null로 하세요.

suggestions는 사용자(실무자)가 이 클라이언트에게 할 수 있는 대응 답변 3개입니다. 각 답변은 이 클라이언트의 **예상 반응(expected)**이 다르게 나오도록 설계하세요:

1. expected: "positive" — 이 클라이언트가 **만족하거나 긍정적으로 반응**할 답변.
   - 군더더기 없이 "네" + 구체적 완료 시간 + 팔로우업 보고 약속.
   - 변명/질문 없이 즉시 실행 의지만 보여줌.
   - 예: "네, 말씀하신 XX 반영해서 오늘 오후 4시까지 완료 후 공유드리겠습니다."
   - 이 클라이언트의 성격상 가장 좋아하는 답변 패턴: 확인→실행→보고.

2. expected: "neutral" — 이 클라이언트가 **수긍하되 약간 아쉬워하는** 답변.
   - 결론(진행하겠다)부터 말하되, 핵심 확인 사항 1개를 짧게 질문.
   - 예: "알겠습니다. 오늘 중 진행하겠습니다. 다만 XX 건만 확정본대로 반영하면 될까요?"

3. expected: "negative" — 이 클라이언트가 **불만족하거나 화를 낼** 답변.
   - 지연/변명이 포함되거나, 추상적이거나, 질문이 많은 답변.
   - 예: "확인해보겠습니다. 다만 XX 때문에 시간이 좀 걸릴 것 같은데, 내일까지 가능할까요?"

각 대응은 현재 대화 맥락에 맞게 구체적으로 작성하세요. 추상적 표현("노력하겠습니다")은 positive/neutral에선 절대 사용하지 마세요. negative 유형에서만 이 클라이언트가 싫어하는 패턴을 의도적으로 포함하세요.`);

  return parts.filter(Boolean).join("\n");
}

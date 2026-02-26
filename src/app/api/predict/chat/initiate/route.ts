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

  const { avatarId, simulationScenario, context } = await req.json();

  // Get avatar profile
  const { data: avatar } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (!avatar)
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });

  const systemPrompt = buildInitiatePrompt(avatar, simulationScenario, context);

  const geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: "user",
          parts: [{ text: "대화를 시작해주세요." }],
        },
      ],
    }),
  });

  const geminiData = await geminiRes.json();
  const rawReply =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
    "응답을 생성할 수 없습니다.";

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
      // JSON parsing failed
    }
  }

  // Create session
  const sessionTitle = reply.replace(/<br\s*\/?>/gi, " ").slice(0, 50);
  const { data: newSession } = await supabase
    .from("chat_sessions")
    .insert({
      avatar_id: avatarId,
      title: `[수신] ${sessionTitle}`,
      created_by: user.id,
    })
    .select("id")
    .single();

  const activeSessionId = newSession?.id;

  // Save the avatar's initial message
  if (activeSessionId) {
    await supabase.from("chat_messages").insert({
      session_id: activeSessionId,
      role: "assistant",
      content: reply,
    });
  }

  return NextResponse.json({
    reply,
    sessionId: activeSessionId,
    sentiment,
    warning,
    suggestions,
  });
}

function buildInitiatePrompt(
  avatar: any,
  simulationScenario?: string,
  context?: string
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

  parts.push("");
  parts.push("당신은 이 클라이언트로서 **먼저** 실무자에게 메시지를 보내는 상황입니다.");
  parts.push("업무 중 자연스럽게 슬랙이나 메신저로 먼저 연락하는 것처럼 메시지를 작성하세요.");

  if (context) {
    parts.push("");
    parts.push(`[상황 설명] ${context}`);
    parts.push("위 상황을 바탕으로 클라이언트가 먼저 연락하는 메시지를 작성하세요.");
  }

  if (simulationScenario) {
    parts.push("");
    parts.push(`[시나리오] ${simulationScenario}`);
    parts.push("이 시나리오에 맞게 클라이언트가 먼저 연락하는 상황을 만들어주세요.");
  }

  if (!context && !simulationScenario) {
    parts.push("");
    parts.push("다음 중 하나의 상황을 랜덤하게 선택하여 먼저 연락하세요:");
    parts.push("- 업무 진행 상황 확인/독촉");
    parts.push("- 일정 변경 요청");
    parts.push("- 새로운 요청 사항");
    parts.push("- 이전 미팅 팔로업");
    parts.push("- 불만/이슈 제기");
    parts.push("- 견적/비용 관련 문의");
    parts.push("이 클라이언트의 성격과 말투에 맞게 자연스럽게 시작하세요.");
  }

  parts.push("");
  parts.push("한국어로 응답하세요.");
  parts.push("");
  parts.push(`응답은 반드시 다음 JSON 형식으로 해주세요:
{"reply": "클라이언트가 먼저 보내는 메시지", "sentiment": "positive|neutral|negative", "warning": "민감 주제 감지 시 경고 메시지 또는 null", "suggestions": [{"text": "대응 답변", "expected": "positive"}, {"text": "대응 답변", "expected": "neutral"}, {"text": "대응 답변", "expected": "negative"}]}

sentiment는 이 메시지의 감정 톤입니다.
warning은 민감한 주제(${avatar.sensitive_topics?.join(", ") || "없음"})가 감지되었을 때만 넣어주세요.

suggestions는 실무자가 이 메시지에 대응할 수 있는 답변 3개입니다:
1. expected: "positive" — 클라이언트가 만족할 즉시 실행형 답변
2. expected: "neutral" — 클라이언트가 수긍하되 아쉬워할 확인형 답변
3. expected: "negative" — 클라이언트가 불만족할 지연/변명형 답변

각 대응은 구체적으로 작성하세요.`);

  return parts.filter(Boolean).join("\n");
}

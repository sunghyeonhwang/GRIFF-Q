import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiChat, checkRateLimit } from "@/lib/ai/gemini-client";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  if (!geminiChat) {
    return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다." }, { status: 503 });
  }

  const rateCheck = checkRateLimit(user.id, "scrum");
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `요청 한도 초과. 잠시 후 다시 시도하세요.` },
      { status: 429 }
    );
  }

  let body: { message: string; conversation: { role: string; content: string }[]; context: Parameters<typeof buildScrumSystemPrompt>[0] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { message, conversation, context } = body;

  const systemPrompt = buildScrumSystemPrompt(context);

  const chatHistory = (conversation ?? []).map(
    (m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : ("model" as const),
      parts: [{ text: m.content }],
    })
  );

  const chat = geminiChat.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "네, 알겠습니다. 데일리 스크럼을 도와드리겠습니다!" }] },
      ...chatHistory,
    ],
  });

  let result;
  try {
    result = await chat.sendMessageStream(message);
  } catch {
    return NextResponse.json({ error: "AI 서비스 연결에 실패했습니다." }, { status: 502 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "스트리밍 오류" })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildScrumSystemPrompt(context: {
  userName: string;
  carryOverItems: { title: string }[];
  dueSoonTasks: { title: string; due_date: string }[];
  todaySchedules: { title: string; start_time: string; end_time: string }[];
}): string {
  const lines = [
    "당신은 GRIFF-Q 데일리 스크럼 도우미입니다.",
    `사용자: ${context.userName}`,
    "",
    "역할: 사용자가 오늘 할 일을 정리하도록 도와주세요.",
    "- 자연스러운 한국어 대화로 할 일을 물어보세요",
    "- 사용자가 말한 내용에서 할 일 항목을 추출하세요",
    "- 대화가 끝나면 정리된 목록을 보여주세요",
    "- 짧고 친근하게 대화하세요 (2~3문장 이내)",
    "",
  ];

  if (context.carryOverItems.length > 0) {
    lines.push("어제 미완료 항목:");
    context.carryOverItems.forEach((i) => lines.push(`  - ${i.title}`));
    lines.push("→ 이 항목들을 오늘 이어서 할지 물어보세요.");
    lines.push("");
  }

  if (context.dueSoonTasks.length > 0) {
    lines.push("마감 임박 Task (D-2 이내):");
    context.dueSoonTasks.forEach((t) => lines.push(`  - ${t.title} (마감: ${t.due_date})`));
    lines.push("");
  }

  if (context.todaySchedules.length > 0) {
    lines.push("오늘 일정:");
    context.todaySchedules.forEach((s) =>
      lines.push(`  - ${s.title} (${s.start_time}~${s.end_time})`)
    );
    lines.push("");
  }

  return lines.join("\n");
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiChat, buildProjectContext, checkRateLimit } from "@/lib/ai/gemini-client";

const SYSTEM_PROMPT = `당신은 프로젝트 매니저 보조 AI입니다.
아래에 제공되는 프로젝트 데이터를 기반으로 정확하게 답변하세요.
데이터에 없는 내용은 추측하지 말고 "해당 데이터가 없습니다"라고 답하세요.
한국어로 응답하세요.
답변은 간결하고 실무적으로 작성하세요.`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  // 1. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Gemini API 키 확인
  if (!geminiChat) {
    return NextResponse.json(
      { error: "AI 서비스가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  // 3. Rate limit 확인
  const rateCheck = checkRateLimit(user.id, projectId);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: rateCheck.message }, { status: 429 });
  }

  // 4. Request body 파싱
  const { message, conversationId } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message가 필요합니다." }, { status: 400 });
  }

  // 5. 프로젝트 데이터 로드
  const [projectRes, membersRes, milestonesRes, tasksRes, depsRes] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("project_members")
        .select("*, users!project_members_user_id_fkey(name, email)")
        .eq("project_id", projectId),
      supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order"),
      supabase
        .from("tasks")
        .select("*, users!tasks_assignee_id_fkey(name, email)")
        .eq("project_id", projectId)
        .order("sort_order"),
      supabase.from("task_dependencies").select("*"),
    ]);

  if (!projectRes.data) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const project = projectRes.data;
  const members = (membersRes.data ?? []).map((m: any) => ({
    ...m,
    user: m.users ? { name: m.users.name, email: m.users.email } : undefined,
  }));
  const milestones = milestonesRes.data ?? [];
  const tasks = (tasksRes.data ?? []).map((t: any) => ({
    ...t,
    assignee: t.users ? { name: t.users.name, email: t.users.email } : undefined,
  }));

  // 의존성은 현재 프로젝트 Task 기준으로 필터
  const taskIds = new Set(tasks.map((t: any) => t.id));
  const dependencies = (depsRes.data ?? []).filter(
    (d: any) => taskIds.has(d.task_id) || taskIds.has(d.depends_on_id)
  );

  // 6. 프로젝트 컨텍스트 빌드
  const contextText = buildProjectContext({
    project,
    members,
    milestones,
    tasks,
    dependencies,
  });

  // 7. 대화 히스토리 로드
  let conversationMessages: { role: string; content: string }[] = [];
  let activeConvId = conversationId;

  if (activeConvId) {
    const { data: conv } = await supabase
      .from("project_review_conversations")
      .select("messages")
      .eq("id", activeConvId)
      .eq("user_id", user.id)
      .single();
    if (conv?.messages) {
      conversationMessages = conv.messages as any[];
    }
  }

  // 8. Gemini 스트리밍 호출
  const chatHistory = conversationMessages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const chat = geminiChat.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\n${contextText}` }],
      },
      {
        role: "model",
        parts: [
          {
            text: "프로젝트 데이터를 확인했습니다. 프로젝트에 대해 궁금한 점을 질문해주세요.",
          },
        ],
      },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessageStream(message);

  // 9. SSE 스트림 생성
  let fullResponse = "";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // 스트림 완료 후 대화 히스토리 저장
        const updatedMessages = [
          ...conversationMessages,
          { role: "user", content: message, timestamp: new Date().toISOString() },
          { role: "assistant", content: fullResponse, timestamp: new Date().toISOString() },
        ];

        if (activeConvId) {
          await supabase
            .from("project_review_conversations")
            .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
            .eq("id", activeConvId);
        } else {
          const { data: newConv } = await supabase
            .from("project_review_conversations")
            .insert({
              project_id: projectId,
              user_id: user.id,
              messages: updatedMessages,
            })
            .select("id")
            .single();
          activeConvId = newConv?.id;
        }

        // 완료 이벤트
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, conversationId: activeConvId })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "AI 응답 생성 중 오류가 발생했습니다.";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        );
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

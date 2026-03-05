import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

type Action = "analyze_overview" | "analyze_risks" | "chat";

interface RequestBody {
  projectId: string;
  kickoffId: string;
  action: Action;
  message?: string;
  history?: { role: string; content: string }[];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, kickoffId, action, message, history } =
    (await req.json()) as RequestBody;

  if (!projectId || !kickoffId || !action) {
    return NextResponse.json(
      { error: "projectId, kickoffId, action are required" },
      { status: 400 }
    );
  }

  // Fetch kickoff data
  const { data: kickoff } = await supabase
    .from("project_kickoffs")
    .select("*")
    .eq("id", kickoffId)
    .single();

  if (!kickoff)
    return NextResponse.json({ error: "Kickoff not found" }, { status: 404 });

  // Fetch project data
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  let systemPrompt: string;
  const contents: { role: string; parts: { text: string }[] }[] = [];

  const kickoffContext = [
    `[프로젝트 정보]`,
    `- 프로젝트명: ${project.name}`,
    `- 시작일: ${project.start_date || "미정"}`,
    `- 종료일: ${project.end_date || "미정"}`,
    `- 설명: ${project.description || "없음"}`,
    ``,
    `[킥오프 정보]`,
    `- 목표: ${kickoff.objective || "미작성"}`,
    `- 범위: ${kickoff.scope || "미작성"}`,
    `- 제약조건: ${kickoff.constraints || "미작성"}`,
    `- 성공기준: ${kickoff.success_criteria || "미작성"}`,
    `- 비고: ${kickoff.notes || "없음"}`,
  ].join("\n");

  if (action === "analyze_overview") {
    const teamMembers = await fetchTeamMembers(supabase, projectId);
    systemPrompt = buildOverviewPrompt(kickoffContext, teamMembers);
    contents.push({
      role: "user",
      parts: [
        {
          text: "이 프로젝트의 킥오프 개요를 분석하고, WBS 초안과 추가 체크리스트를 제안해주세요.",
        },
      ],
    });
  } else if (action === "analyze_risks") {
    const postmortemData = await fetchPostmortems(supabase);
    systemPrompt = buildRiskPrompt(kickoffContext, postmortemData);
    contents.push({
      role: "user",
      parts: [
        {
          text: "과거 포스트모템 데이터를 기반으로 이 프로젝트의 리스크를 분석해주세요.",
        },
      ],
    });
  } else if (action === "chat") {
    const checklistItems = await fetchChecklist(supabase, kickoffId);
    const postmortemData = await fetchPostmortems(supabase);
    const teamMembers = await fetchTeamMembers(supabase, projectId);
    systemPrompt = buildChatPrompt(kickoffContext, checklistItems, postmortemData, teamMembers);

    // Add history
    for (const msg of history || []) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Add current message
    if (message) {
      contents.push({ role: "user", parts: [{ text: message }] });
    }
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Call Gemini API
  try {
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

    // Parse JSON response
    let reply = rawReply;
    let suggestions: any[] = [];
    let risks: any[] = [];

    const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.reply) {
          reply = parsed.reply;
          suggestions = parsed.suggestions || [];
          risks = parsed.risks || [];
        }
      } catch {
        // JSON parsing failed, use raw text
      }
    }

    // Save conversation to kickoff_ai_conversations
    const now = new Date().toISOString();
    const userMessage =
      action === "chat"
        ? message || ""
        : action === "analyze_overview"
          ? "[개요 분석 요청]"
          : "[리스크 분석 요청]";

    const newMessages = [
      { role: "user" as const, content: userMessage, timestamp: now },
      { role: "assistant" as const, content: reply, timestamp: now },
    ];

    const { data: existingConv } = await supabase
      .from("kickoff_ai_conversations")
      .select("id, messages")
      .eq("kickoff_id", kickoffId)
      .eq("user_id", user.id)
      .single();

    if (existingConv) {
      const updatedMessages = [
        ...((existingConv.messages as any[]) || []),
        ...newMessages,
      ];
      await supabase
        .from("kickoff_ai_conversations")
        .update({ messages: updatedMessages })
        .eq("id", existingConv.id);
    } else {
      await supabase.from("kickoff_ai_conversations").insert({
        kickoff_id: kickoffId,
        user_id: user.id,
        messages: newMessages,
      });
    }

    return NextResponse.json({ reply, suggestions, risks });
  } catch (error) {
    console.error("[kickoff/ai] Gemini API error:", error);
    return NextResponse.json(
      {
        reply: "AI 응답을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.",
        suggestions: [],
        risks: [],
      },
      { status: 500 }
    );
  }
}

// --- Prompt builders ---

function buildOverviewPrompt(kickoffContext: string, teamMembers: string): string {
  return `당신은 프로젝트 킥오프 어시스턴트입니다. 프로젝트 개요를 분석하여 WBS 초안과 추가 체크리스트를 제안합니다.

${kickoffContext}

[팀 멤버]
${teamMembers}

위 프로젝트 정보를 분석하여 다음을 포함한 응답을 생성하세요:
1. 프로젝트 개요 분석 요약
2. WBS(Work Breakdown Structure) 초안 — 단계별 주요 작업 항목
3. 추가로 필요한 체크리스트 항목 (적절한 담당자 assignee_id 포함)

반드시 한국어로 응답하세요.
응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "reply": "마크다운 형식의 분석 결과",
  "suggestions": [
    {
      "label": "WBS를 Task로 생성",
      "action": "create_tasks",
      "data": [{"title": "작업명", "description": "설명"}]
    },
    {
      "label": "체크리스트에 추가",
      "action": "add_checklist",
      "data": [{"title": "항목명", "description": "설명", "assignee_id": "담당자UUID"}]
    }
  ]
}`;
}

function buildRiskPrompt(
  kickoffContext: string,
  postmortemData: string
): string {
  const hasPostmortems = postmortemData !== "없음";

  return `당신은 프로젝트 리스크 분석 전문가입니다. 과거 포스트모템 데이터를 분석하여 현재 프로젝트에 적용 가능한 리스크와 개선 방안을 도출합니다.

${kickoffContext}

[과거 포스트모템 데이터]
${postmortemData}

${
  hasPostmortems
    ? "위 과거 포스트모템 데이터를 분석하여 현재 프로젝트에 적용 가능한 리스크를 도출하세요. 각 리스크에 source_project로 원본 프로젝트명을 명시하세요."
    : "과거 포스트모템 데이터가 없습니다. 프로젝트 설명과 일반적인 프로젝트 리스크 패턴을 기반으로 분석하세요. source_project는 '일반 패턴'으로 표시하세요."
}

반드시 한국어로 응답하세요.
응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "reply": "마크다운 형식의 리스크 분석 결과",
  "risks": [
    {
      "level": "low|medium|high",
      "title": "리스크 제목",
      "description": "리스크 설명",
      "recommendation": "권장 대응 방안",
      "source_project": "원본 프로젝트명 또는 일반 패턴"
    }
  ],
  "suggestions": [
    {
      "label": "리스크 대응을 체크리스트에 추가",
      "action": "add_checklist",
      "data": [{"title": "항목명", "description": "설명"}]
    },
    {
      "label": "비고에 추가",
      "action": "add_notes",
      "data": "리스크 분석 요약 텍스트"
    }
  ]
}`;
}

function buildChatPrompt(
  kickoffContext: string,
  checklistItems: string,
  postmortemData: string,
  teamMembers: string
): string {
  return `당신은 프로젝트 킥오프 전문 어시스턴트입니다. 킥오프 관련 질문에 전문적으로 답변합니다.

${kickoffContext}

[팀 멤버]
${teamMembers}

[체크리스트 현황]
${checklistItems}

[과거 포스트모템 참고 데이터]
${postmortemData}

위 컨텍스트를 참고하여 사용자의 질문에 답변하세요.
필요한 경우 체크리스트 추가, 비고 메모, Task 생성 등을 제안할 수 있습니다.
담당자 배정이 논의되면, 팀 멤버의 id(UUID)를 assignee_id로 포함하세요.

반드시 한국어로 응답하세요.
응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "reply": "마크다운 형식의 답변",
  "suggestions": [
    {
      "label": "제안 레이블",
      "action": "add_checklist|add_notes|create_tasks|ignore",
      "data": "액션에 맞는 데이터 (add_checklist인 경우: [{title, description, assignee_id, due_date}])"
    }
  ]
}`;
}

// --- Data fetchers ---

async function fetchPostmortems(supabase: any): Promise<string> {
  const { data: postmortems } = await supabase
    .from("postmortems")
    .select("*, projects!inner(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!postmortems || postmortems.length === 0) return "없음";

  return postmortems
    .map(
      (pm: any) =>
        `- 프로젝트: ${pm.projects.name}\n  제목: ${pm.title}\n  심각도: ${pm.severity}\n  근본원인: ${pm.root_cause}\n  교훈: ${JSON.stringify(pm.lessons_learned)}\n  액션아이템: ${JSON.stringify(pm.action_items)}`
    )
    .join("\n\n");
}

async function fetchTeamMembers(supabase: any, projectId: string): Promise<string> {
  const { data: members } = await supabase
    .from("project_members")
    .select("user_id, role, users!inner(name)")
    .eq("project_id", projectId);

  if (!members || members.length === 0) return "팀 멤버 정보 없음";

  return members
    .map(
      (m: any) =>
        `- ${m.users.name} (id: ${m.user_id}, 역할: ${m.role})`
    )
    .join("\n");
}

async function fetchChecklist(
  supabase: any,
  kickoffId: string
): Promise<string> {
  const { data: items } = await supabase
    .from("kickoff_checklist_items")
    .select("title, description, is_completed, due_date")
    .eq("kickoff_id", kickoffId)
    .order("sort_order", { ascending: true });

  if (!items || items.length === 0) return "체크리스트 항목 없음";

  return items
    .map(
      (item: any) =>
        `- [${item.is_completed ? "x" : " "}] ${item.title}${item.due_date ? ` (기한: ${item.due_date})` : ""}`
    )
    .join("\n");
}

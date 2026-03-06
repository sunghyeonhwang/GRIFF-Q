import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiReport, buildProjectContext, checkRateLimit } from "@/lib/ai/gemini-client";
import type { ReviewReportContent, RiskLevel } from "@/types/review.types";

const REPORT_PROMPT = `당신은 프로젝트 매니저 보조 AI입니다.
아래 프로젝트 데이터를 분석하여 구조화된 보고서를 JSON 형식으로 작성하세요.

반드시 아래 JSON 구조를 정확히 따르세요:
{
  "executive_summary": "3-5문장의 프로젝트 현황 요약",
  "progress_overview": {
    "total_tasks": 전체 Task 수,
    "completed": 완료된 Task 수,
    "in_progress": 진행중 Task 수,
    "delayed": 지연 Task 수,
    "completion_rate": 완료율 (0-100)
  },
  "completed_this_period": ["이번 기간 완료된 항목들"],
  "in_progress_items": ["현재 진행중인 항목들"],
  "delayed_items": [{"title": "지연 항목명", "reason": "지연 사유", "impact": "영향도"}],
  "risks": [{"description": "리스크 설명", "level": "low|medium|high|critical", "mitigation": "대응 방안"}],
  "next_period_plan": ["다음 기간 계획 항목들"]
}

JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`;

function determineRiskLevel(report: ReviewReportContent): RiskLevel {
  const { progress_overview, delayed_items, risks } = report;
  const criticalRisks = risks.filter((r) => r.level === "critical").length;
  const highRisks = risks.filter((r) => r.level === "high").length;
  const delayRate =
    progress_overview.total_tasks > 0
      ? delayed_items.length / progress_overview.total_tasks
      : 0;

  if (criticalRisks > 0 || delayRate > 0.5) return "critical";
  if (highRisks > 1 || delayRate > 0.3) return "high";
  if (highRisks > 0 || delayRate > 0.1) return "medium";
  return "low";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!geminiReport) {
    return NextResponse.json(
      { error: "AI 서비스가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const rateCheck = checkRateLimit(user.id, projectId);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: rateCheck.message }, { status: 429 });
  }

  const { type = "on_demand" } = await req.json();

  // 프로젝트 데이터 로드
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
  const taskIds = new Set(tasks.map((t: any) => t.id));
  const dependencies = (depsRes.data ?? []).filter(
    (d: any) => taskIds.has(d.task_id) || taskIds.has(d.depends_on_id)
  );

  const contextText = buildProjectContext({
    project,
    members,
    milestones,
    tasks,
    dependencies,
  });

  try {
    const result = await geminiReport.generateContent(
      `${REPORT_PROMPT}\n\n---\n\n${contextText}`
    );
    const responseText = result.response.text();

    // JSON 파싱 (코드블록 제거)
    const jsonStr = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const reportContent: ReviewReportContent = JSON.parse(jsonStr);
    const riskLevel = determineRiskLevel(reportContent);

    // 보고서 저장
    const { data: review, error } = await supabase
      .from("project_reviews")
      .insert({
        project_id: projectId,
        review_type: type,
        generated_by: user.id,
        summary: reportContent.executive_summary,
        report_content: reportContent,
        risk_level: riskLevel,
        recommendations: reportContent.risks.map((r) => ({
          type: "risk" as const,
          title: r.description.slice(0, 50),
          description: r.mitigation,
          priority: r.level === "critical" || r.level === "high" ? "high" : r.level === "medium" ? "medium" : "low",
        })),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(review);
  } catch (err) {
    const message = err instanceof Error ? err.message : "보고서 생성 중 오류 발생";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

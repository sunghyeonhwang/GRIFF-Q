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

  const { avatarId, content, fileType, fileName } = await req.json();

  const fileTypeLabel =
    fileType === "kakaotalk"
      ? "카카오톡 대화 내보내기"
      : fileType === "slack"
        ? "슬랙 대화"
        : "이메일/CSV";

  const prompt = `당신은 조직심리학 전문가입니다. 다음 ${fileTypeLabel} 데이터에서 주요 발화자(가장 많이 말하는 사람)의 성격, 리더십 스타일, 커뮤니케이션 패턴을 심층 분석해주세요.

분석 관점:
- 리더십/관리 스타일: 지시형인지 합의형인지, 마이크로매니징 여부, 팔로업 집요도
- 감정 표현 패턴: 불만/짜증 표현 방식, 칭찬 빈도, 감정적 말투 특징
- 커뮤니케이션 철학: "합의"형인지 "정렬·집행"형인지, 책임 소재 명확화 정도
- 업무 기준: 실행 누락에 대한 허용치, 일정/마감에 대한 엄격도
- 대화 습관: 반복되는 표현, 말버릇, 특유의 어미/접속사, 한숨/감탄사

데이터:
${content.slice(0, 15000)}

다음 JSON 형식으로 응답해주세요 (JSON만 반환, 다른 텍스트 없이):
{
  "tone_style": "말투 스타일을 2-3문장으로 구체적으로 설명. 단순히 '격식체'가 아니라 '~해주세요 체를 기본으로 쓰지만, 불만 시 반말이 섞이며 ;;, 에효 같은 감탄사로 짜증을 표현' 수준으로 상세하게",
  "personality_tags": ["리더십/성격을 나타내는 키워드 5-8개. 예: 고기준형, 실행중심, 마이크로매니저, 직설적, 책임추궁형 등"],
  "decision_pattern": "의사결정 방식을 구체적으로 설명. 예: '즉시 판단하고 지시하는 톱다운형. 부하직원에게 확인을 요구하지만 최종 결정은 본인이 함'",
  "sensitive_topics": ["이 사람이 특히 예민하게 반응하는 주제/상황들"],
  "common_phrases": ["실제 대화에서 반복적으로 사용한 표현/말버릇을 원문 그대로 추출. 최소 5개"],
  "response_style": "응답 형태를 구체적으로 설명. 길이, 연속 메시지 패턴, 멘션(@) 사용 빈도, 스크린샷 첨부 습관 등",
  "emoji_usage": "이모지/이모티콘/특수문자 사용 패턴. 실제 사용한 것들을 예시로 포함",
  "summary": "이 사람의 전체적인 커뮤니케이션 성향을 3-4문장으로 요약. 함께 일하는 사람 입장에서 어떤 느낌인지 포함"
}`;

  const geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  const geminiData = await geminiRes.json();
  const replyText =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const jsonMatch = replyText.match(/\{[\s\S]*\}/);
  let analysisResult = null;
  if (jsonMatch) {
    try {
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch {
      // JSON parsing failed
    }
  }

  if (!analysisResult) {
    return NextResponse.json(
      { error: "분석에 실패했습니다." },
      { status: 500 }
    );
  }

  // Save training data
  await supabase.from("avatar_training_data").insert({
    avatar_id: avatarId,
    file_name: fileName || "upload",
    file_type: fileType,
    raw_content: content.slice(0, 50000),
    analysis_result: analysisResult,
    created_by: user.id,
  });

  return NextResponse.json({ analysis: analysisResult });
}

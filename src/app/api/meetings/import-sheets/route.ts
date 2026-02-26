import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sheetsUrl } = await req.json();

  // Extract spreadsheet ID
  const match = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match)
    return NextResponse.json({ error: "Invalid Sheets URL" }, { status: 400 });
  const spreadsheetId = match[1];

  // Read sheets data using service account
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const { data: spreadsheet } = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const firstSheet =
      spreadsheet.sheets?.[0]?.properties?.title ?? "Sheet1";

    const { data: values } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: firstSheet,
    });

    const rows = values.values ?? [];
    if (rows.length === 0)
      return NextResponse.json({ error: "Empty sheet" }, { status: 400 });

    // Use Gemini to parse and map fields
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `다음은 Google Sheets에서 가져온 회의록 데이터입니다. 이 데이터를 분석하여 회의록 형식으로 변환해주세요.

데이터:
${rows.map((r) => r.join("\t")).join("\n")}

다음 JSON 형식으로 응답해주세요 (JSON만 반환, 다른 텍스트 없이):
{
  "title": "회의 제목",
  "meeting_date": "YYYY-MM-DD",
  "content": "회의 내용 전체",
  "action_items": [
    { "title": "액션아이템명", "due_date": "YYYY-MM-DD 또는 null", "note": "비고" }
  ]
}`,
              },
            ],
          },
        ],
      }),
    });

    const geminiData = await geminiRes.json();
    const replyText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from reply
    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    let parsed = null;
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // JSON parsing failed, parsed remains null
      }
    }

    return NextResponse.json({ parsed, raw: rows });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to read sheets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

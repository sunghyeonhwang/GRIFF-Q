import { google } from "googleapis";
import { VAT_RATE } from "@/lib/estimate-constants";

export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

export async function exportEstimateToSheets(
  estimateId: string,
  supabase: any
): Promise<string> {
  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", estimateId)
    .single();

  if (!estimate) throw new Error("Estimate not found");

  const { data: estimateItems } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("estimate_id", estimateId)
    .order("sort_order");

  const items = estimateItems ?? [];

  const sheets = await getGoogleSheetsClient();

  // Create new spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `견적서 - ${estimate.project_name}`,
      },
      sheets: [
        { properties: { title: "견적정보" } },
        { properties: { title: "견적항목" } },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;

  // Fill Sheet 1: 견적정보
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "견적정보!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["항목", "내용"],
        ["프로젝트명", estimate.project_name],
        ["클라이언트", estimate.client_name],
        [
          "견적일",
          estimate.estimate_date
            ? new Date(estimate.estimate_date).toLocaleDateString("ko-KR")
            : "-",
        ],
        [
          "유효기한",
          estimate.valid_until
            ? new Date(estimate.valid_until).toLocaleDateString("ko-KR")
            : "-",
        ],
        ["상태", estimate.status],
        ...(estimate.note ? [["비고", estimate.note]] : []),
      ],
    },
  });

  // Fill Sheet 2: 견적항목
  let subtotal = 0;
  const itemRows = items.map(
    (item: any, index: number) => {
      const amount = Number(item.quantity) * Number(item.unit_price);
      subtotal += amount;
      return [
        index + 1,
        item.item_name,
        item.specification || "-",
        Number(item.quantity),
        item.unit || "-",
        Number(item.unit_price),
        amount,
      ];
    }
  );

  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "견적항목!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["#", "항목명", "규격/설명", "수량", "단위", "단가", "금액"],
        ...itemRows,
        [],
        ["", "소계", "", "", "", "", subtotal],
        [
          "",
          `부가세 (${(VAT_RATE * 100).toFixed(0)}%)`,
          "",
          "",
          "",
          "",
          vat,
        ],
        ["", "합계", "", "", "", "", total],
      ],
    },
  });

  // Bold header rows
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: spreadsheet.data.sheets![0].properties!.sheetId!,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: { textFormat: { bold: true } },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: spreadsheet.data.sheets![1].properties!.sheetId!,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: { textFormat: { bold: true } },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

export async function exportMeetingToSheets(
  meetingId: string,
  supabase: any
): Promise<string> {
  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (!meeting) throw new Error("Meeting not found");

  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*, users!action_items_assignee_id_fkey(name)")
    .eq("meeting_id", meetingId)
    .order("created_at");

  // Resolve attendee UUIDs
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("is_active", true);

  const userMap = new Map(
    (allUsers ?? []).map((u: any) => [u.id, u.name])
  );

  const attendeeNames = (meeting.attendees as string[])
    ?.map((uid: string) => userMap.get(uid))
    .filter(Boolean)
    .join(", ");

  const statusLabel: Record<string, string> = {
    pending: "대기",
    in_progress: "진행중",
    completed: "완료",
  };

  const sheets = await getGoogleSheetsClient();

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `회의록 - ${meeting.title}`,
      },
      sheets: [
        { properties: { title: "회의록" } },
        { properties: { title: "액션아이템" } },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;

  // Fill Sheet 1: 회의록
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "회의록!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["항목", "내용"],
        ["제목", meeting.title],
        [
          "회의일",
          new Date(meeting.meeting_date).toLocaleDateString("ko-KR"),
        ],
        ["참석자", attendeeNames || "-"],
        ["내용", meeting.content || "-"],
      ],
    },
  });

  // Fill Sheet 2: 액션아이템
  const aiRows = (actionItems ?? []).map((ai: any, index: number) => [
    index + 1,
    ai.title,
    ai.users?.name ?? "-",
    ai.due_date
      ? new Date(ai.due_date).toLocaleDateString("ko-KR")
      : "-",
    statusLabel[ai.status] ?? ai.status,
    ai.note || "-",
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "액션아이템!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["#", "항목", "담당자", "마감일", "상태", "비고"],
        ...aiRows,
      ],
    },
  });

  // Bold headers
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: spreadsheet.data.sheets![0].properties!.sheetId!,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: { textFormat: { bold: true } },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: spreadsheet.data.sheets![1].properties!.sheetId!,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: { textFormat: { bold: true } },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

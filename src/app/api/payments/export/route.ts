import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  const items = payments ?? [];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("입금결제요청");

  sheet.columns = [
    { header: "이름", key: "name", width: 20 },
    { header: "금액", key: "amount", width: 15 },
    { header: "은행", key: "bank", width: 12 },
    { header: "계좌번호", key: "account_number", width: 20 },
    { header: "입금자명", key: "depositor_name", width: 15 },
    { header: "마감일", key: "due_date", width: 15 },
    { header: "상태", key: "status", width: 10 },
    { header: "비고", key: "note", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };

  const statusLabel: Record<string, string> = {
    pending: "대기",
    completed: "완료",
  };

  for (const p of items) {
    sheet.addRow({
      name: p.name,
      amount: Number(p.amount),
      bank: p.bank,
      account_number: p.account_number,
      depositor_name: p.depositor_name || "-",
      due_date: p.due_date
        ? new Date(p.due_date).toLocaleDateString("ko-KR")
        : "-",
      status: statusLabel[p.status] ?? p.status,
      note: p.note || "-",
    });
  }

  sheet.getColumn("amount").numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="payments-export.xlsx"`,
    },
  });
}

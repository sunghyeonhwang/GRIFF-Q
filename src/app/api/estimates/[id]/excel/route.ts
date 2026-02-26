import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";
import { VAT_RATE } from "@/lib/estimate-constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();

  if (!estimate)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: estimateItems } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");

  const items = estimateItems ?? [];

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: 견적정보
  const infoSheet = workbook.addWorksheet("견적정보");
  infoSheet.columns = [
    { header: "항목", key: "label", width: 20 },
    { header: "내용", key: "value", width: 40 },
  ];
  infoSheet.getRow(1).font = { bold: true };

  infoSheet.addRow({ label: "프로젝트명", value: estimate.project_name });
  infoSheet.addRow({ label: "클라이언트", value: estimate.client_name });
  infoSheet.addRow({
    label: "견적일",
    value: estimate.estimate_date
      ? new Date(estimate.estimate_date).toLocaleDateString("ko-KR")
      : "-",
  });
  infoSheet.addRow({
    label: "유효기한",
    value: estimate.valid_until
      ? new Date(estimate.valid_until).toLocaleDateString("ko-KR")
      : "-",
  });
  infoSheet.addRow({
    label: "상태",
    value: estimate.status,
  });
  if (estimate.note) {
    infoSheet.addRow({ label: "비고", value: estimate.note });
  }

  // Sheet 2: 견적항목
  const itemsSheet = workbook.addWorksheet("견적항목");
  itemsSheet.columns = [
    { header: "#", key: "no", width: 6 },
    { header: "항목명", key: "item_name", width: 25 },
    { header: "규격/설명", key: "specification", width: 25 },
    { header: "수량", key: "quantity", width: 10 },
    { header: "단위", key: "unit", width: 8 },
    { header: "단가", key: "unit_price", width: 15 },
    { header: "금액", key: "amount", width: 15 },
  ];
  itemsSheet.getRow(1).font = { bold: true };

  let subtotal = 0;
  items.forEach((item, index) => {
    const amount = Number(item.quantity) * Number(item.unit_price);
    subtotal += amount;
    itemsSheet.addRow({
      no: index + 1,
      item_name: item.item_name,
      specification: item.specification || "-",
      quantity: Number(item.quantity),
      unit: item.unit || "-",
      unit_price: Number(item.unit_price),
      amount,
    });
  });

  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  // Add empty row then summary
  itemsSheet.addRow({});
  const subtotalRow = itemsSheet.addRow({
    item_name: "소계",
    amount: subtotal,
  });
  subtotalRow.font = { bold: true };

  const vatRow = itemsSheet.addRow({
    item_name: `부가세 (${(VAT_RATE * 100).toFixed(0)}%)`,
    amount: vat,
  });
  vatRow.font = { bold: true };

  const totalRow = itemsSheet.addRow({ item_name: "합계", amount: total });
  totalRow.font = { bold: true };

  // Number format for currency columns
  itemsSheet.getColumn("unit_price").numFmt = "#,##0";
  itemsSheet.getColumn("amount").numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="estimate-${id}.xlsx"`,
    },
  });
}

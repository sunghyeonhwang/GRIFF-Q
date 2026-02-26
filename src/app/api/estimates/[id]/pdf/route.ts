import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ReactPDF, {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { VAT_RATE } from "@/lib/estimate-constants";
import React from "react";

Font.register({
  family: "NotoSansKR",
  src: "https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLTq8H4hfeE.ttf",
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansKR",
    fontSize: 10,
    padding: 40,
    lineHeight: 1.6,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 80,
    fontWeight: "bold",
    color: "#555",
  },
  infoValue: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  colNo: { width: 30, textAlign: "center" },
  colName: { width: 120 },
  colSpec: { width: 100 },
  colQty: { width: 50, textAlign: "right" },
  colUnit: { width: 40, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  summarySection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#555",
  },
  summaryValue: {
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontWeight: "bold",
    fontSize: 12,
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 12,
  },
  noteSection: {
    marginTop: 30,
  },
  noteTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 11,
  },
  noteText: {
    color: "#555",
    lineHeight: 1.8,
  },
});

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

interface EstimateItem {
  id: string;
  item_name: string;
  specification: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  sort_order: number;
}

interface EstimateData {
  id: string;
  project_name: string;
  client_name: string;
  estimate_date: string | null;
  valid_until: string | null;
  note: string | null;
}

function EstimatePDF({
  estimate,
  items,
}: {
  estimate: EstimateData;
  items: EstimateItem[];
}) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "견적서"),
      React.createElement(
        View,
        { style: styles.infoSection },
        React.createElement(
          View,
          { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "프로젝트명"),
          React.createElement(
            Text,
            { style: styles.infoValue },
            estimate.project_name
          )
        ),
        React.createElement(
          View,
          { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "클라이언트"),
          React.createElement(
            Text,
            { style: styles.infoValue },
            estimate.client_name
          )
        ),
        React.createElement(
          View,
          { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "견적일"),
          React.createElement(
            Text,
            { style: styles.infoValue },
            formatDate(estimate.estimate_date)
          )
        ),
        React.createElement(
          View,
          { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, "유효기한"),
          React.createElement(
            Text,
            { style: styles.infoValue },
            formatDate(estimate.valid_until)
          )
        )
      ),
      // Table header
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.colNo }, "#"),
        React.createElement(Text, { style: styles.colName }, "항목명"),
        React.createElement(Text, { style: styles.colSpec }, "규격/설명"),
        React.createElement(Text, { style: styles.colQty }, "수량"),
        React.createElement(Text, { style: styles.colUnit }, "단위"),
        React.createElement(Text, { style: styles.colPrice }, "단가"),
        React.createElement(Text, { style: styles.colAmount }, "금액")
      ),
      // Table rows
      ...items.map((item, index) => {
        const amount = Number(item.quantity) * Number(item.unit_price);
        return React.createElement(
          View,
          { style: styles.tableRow, key: item.id },
          React.createElement(
            Text,
            { style: styles.colNo },
            String(index + 1)
          ),
          React.createElement(
            Text,
            { style: styles.colName },
            item.item_name
          ),
          React.createElement(
            Text,
            { style: styles.colSpec },
            item.specification || "-"
          ),
          React.createElement(
            Text,
            { style: styles.colQty },
            formatNumber(Number(item.quantity))
          ),
          React.createElement(
            Text,
            { style: styles.colUnit },
            item.unit || "-"
          ),
          React.createElement(
            Text,
            { style: styles.colPrice },
            formatNumber(Number(item.unit_price)) + "원"
          ),
          React.createElement(
            Text,
            { style: styles.colAmount },
            formatNumber(amount) + "원"
          )
        );
      }),
      // Summary
      React.createElement(
        View,
        { style: styles.summarySection },
        React.createElement(
          View,
          { style: styles.summaryRow },
          React.createElement(Text, { style: styles.summaryLabel }, "소계"),
          React.createElement(
            Text,
            { style: styles.summaryValue },
            formatNumber(subtotal) + "원"
          )
        ),
        React.createElement(
          View,
          { style: styles.summaryRow },
          React.createElement(
            Text,
            { style: styles.summaryLabel },
            `부가세 (${(VAT_RATE * 100).toFixed(0)}%)`
          ),
          React.createElement(
            Text,
            { style: styles.summaryValue },
            formatNumber(vat) + "원"
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "합계"),
          React.createElement(
            Text,
            { style: styles.totalValue },
            formatNumber(total) + "원"
          )
        )
      ),
      // Note
      estimate.note
        ? React.createElement(
            View,
            { style: styles.noteSection },
            React.createElement(Text, { style: styles.noteTitle }, "비고"),
            React.createElement(
              Text,
              { style: styles.noteText },
              estimate.note
            )
          )
        : null
    )
  );
}

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

  const pdfBuffer = await ReactPDF.renderToBuffer(
    React.createElement(EstimatePDF, {
      estimate: estimate as EstimateData,
      items: items as EstimateItem[],
    }) as any
  );

  return new NextResponse(Buffer.from(pdfBuffer) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="estimate-${id}.pdf"`,
    },
  });
}

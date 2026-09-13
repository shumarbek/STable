import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { buildCategoryHierarchy } from "@/features/categories/hierarchy";
import type { Category } from "@/types/database";

export const runtime = "nodejs";

const typeLabels: Record<string, string> = {
  expense: "Chiqim",
  income: "Kirim",
  transfer: "O‘tkazma",
  loan: "Qarz berish",
  debt_repayment: "Qarz qaytarish",
  refund: "Qaytarish",
};

interface ExportRow {
  category_id: string | null;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  currency: string;
  note: string | null;
  location: string | null;
  category: { name: string } | { name: string }[] | null;
  account: { name: string } | { name: string }[] | null;
}

function relationName(relation: { name: string } | { name: string }[] | null) {
  if (!relation) return "";
  return Array.isArray(relation) ? (relation[0]?.name ?? "") : relation.name;
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: "Tizimga kirilmagan" }, { status: 401 });

  const [{ data, error }, { data: categoryData }] = await Promise.all([
    supabase.from("transactions").select(
      "category_id,transaction_date,transaction_type,amount,currency,note,location,category:categories(name),account:user_accounts!transactions_account_id_fkey(name)"
    ).order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(5000),
    supabase.from("categories").select("*"),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as ExportRow[];
  const hierarchy = buildCategoryHierarchy((categoryData ?? []) as Category[]);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "STable";
  workbook.created = new Date();
  workbook.modified = new Date();

  const brand = "1E40AF";
  const lightBlue = "DBEAFE";
  const green = "DCFCE7";
  const red = "FEE2E2";
  const moneyFormat = '#,##0 "so‘m";[Red]-#,##0 "so‘m";-';

  const summary = workbook.addWorksheet("Umumiy hisobot", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 4 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  summary.mergeCells("A2:E2");
  summary.getCell("A2").value = "STable moliyaviy hisoboti";
  summary.getCell("A2").font = { name: "Arial", size: 16, bold: true, color: { argb: brand } };
  summary.getCell("A3").value = "Yaratilgan sana";
  summary.getCell("B3").value = new Date();
  summary.getCell("B3").numFmt = "dd.mm.yyyy hh:mm";

  const totalIncome = rows.filter((row) => ["income", "refund", "debt_repayment"].includes(row.transaction_type)).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalExpense = rows.filter((row) => ["expense", "loan"].includes(row.transaction_type)).reduce((sum, row) => sum + Number(row.amount), 0);
  summary.getRow(5).values = ["Ko‘rsatkich", "Qiymat"];
  summary.getRow(6).values = ["Jami kirim", totalIncome];
  summary.getRow(7).values = ["Jami chiqim", totalExpense];
  summary.getRow(8).values = ["Sof natija", totalIncome - totalExpense];
  summary.getRow(9).values = ["Amallar soni", rows.length];
  summary.getRow(5).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brand } };
    cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  [6, 7, 8].forEach((rowNumber) => { summary.getCell(`B${rowNumber}`).numFmt = moneyFormat; });

  const aggregates = new Map<string, { name: string; income: number; expense: number; count: number }>();
  rows.forEach((row) => {
    const entry = row.category_id ? hierarchy.get(row.category_id) : null;
    const id = entry?.root.id ?? "none";
    const current = aggregates.get(id) ?? { name: entry?.root.name ?? "Kategoriyasiz", income: 0, expense: 0, count: 0 };
    if (["income", "refund", "debt_repayment"].includes(row.transaction_type)) current.income += Number(row.amount);
    if (["expense", "loan"].includes(row.transaction_type)) current.expense += Number(row.amount);
    current.count += 1;
    aggregates.set(id, current);
  });
  const summaryStart = 12;
  const categoryRows = [...aggregates.values()].sort((a, b) => b.expense + b.income - a.expense - a.income)
    .map((item) => [item.name, item.income, item.expense, item.income - item.expense, item.count]);
  summary.addTable({ name: "KategoriyaHisoboti", ref: `A${summaryStart}`, headerRow: true, totalsRow: true,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: [
      { name: "Umumiy kategoriya", totalsRowLabel: "Jami" },
      { name: "Kirim", totalsRowFunction: "sum" },
      { name: "Chiqim", totalsRowFunction: "sum" },
      { name: "Sof natija", totalsRowFunction: "sum" },
      { name: "Amallar soni", totalsRowFunction: "sum" },
    ], rows: categoryRows });
  const categoryEnd = summaryStart + categoryRows.length + 1;
  summary.getColumn(1).width = 32;
  [2, 3, 4].forEach((columnNumber) => {
    summary.getColumn(columnNumber).width = 19;
    summary.getColumn(columnNumber).numFmt = moneyFormat;
  });
  summary.getColumn(5).width = 15;
  summary.getCell("B6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: green } };
  summary.getCell("B7").fill = { type: "pattern", pattern: "solid", fgColor: { argb: red } };
  summary.autoFilter = { from: { row: summaryStart, column: 1 }, to: { row: categoryEnd, column: 5 } };

  const detail = workbook.addWorksheet("Kirim va chiqimlar", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 4 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  detail.mergeCells("A2:I2");
  detail.getCell("A2").value = "Kirim va chiqimlar tafsiloti";
  detail.getCell("A2").font = { name: "Arial", size: 16, bold: true, color: { argb: brand } };
  const detailRows = rows.map((row) => {
    const entry = row.category_id ? hierarchy.get(row.category_id) : null;
    return [new Date(`${row.transaction_date}T00:00:00`), typeLabels[row.transaction_type] ?? "Boshqa",
      entry?.root.name ?? "Kategoriyasiz", relationName(row.category), Number(row.amount), row.currency,
      relationName(row.account), row.note ?? "", row.location ?? ""];
  });
  detail.addTable({ name: "AmallarJadvali", ref: "A4", headerRow: true, totalsRow: true,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: [
      { name: "Sana", totalsRowLabel: "Jami" }, { name: "Turi" }, { name: "Umumiy kategoriya" },
      { name: "Batafsil turi" }, { name: "Summa", totalsRowFunction: "sum" }, { name: "Valyuta" },
      { name: "Hisob" }, { name: "Izoh" }, { name: "Manzil" },
    ], rows: detailRows });
  detail.getColumn(1).numFmt = "dd.mm.yyyy";
  detail.getColumn(1).width = 14;
  detail.getColumn(2).width = 17;
  detail.getColumn(3).width = 29;
  detail.getColumn(4).width = 27;
  detail.getColumn(5).width = 19;
  detail.getColumn(5).numFmt = moneyFormat;
  detail.getColumn(6).width = 11;
  detail.getColumn(7).width = 18;
  detail.getColumn(8).width = 35;
  detail.getColumn(9).width = 25;
  detail.getRows(5, detailRows.length)?.forEach((row) => {
    const type = String(row.getCell(2).value ?? "");
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: type === "Kirim" ? green : type === "Chiqim" ? red : lightBlue } };
  });
  [summary, detail].forEach((sheet) => {
    sheet.properties.defaultRowHeight = 20;
    sheet.eachRow((row) => row.eachCell((cell) => { cell.font = { ...cell.font, name: "Arial", size: cell.font?.size ?? 10 }; cell.alignment = { ...cell.alignment, vertical: "middle" }; }));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="STable-kirim-chiqimlar-${date}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}

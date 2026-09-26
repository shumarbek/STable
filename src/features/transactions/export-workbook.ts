import ExcelJS from "exceljs";

export interface ExportTransactionRecord {
  id: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  transactionType: string;
  amount: number;
  currency: string;
  isZeroConsumption: boolean;
  rootCategory: string;
  detailCategory: string;
  accountName: string;
  targetAccountName: string;
  note: string;
  location: string;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  transactionCount: number;
  activeExpenseDays: number;
  averageDailyExpense: number;
  transferTotal: number;
}

const inflowTypes = new Set(["income", "refund", "debt_repayment"]);
const outflowTypes = new Set(["expense", "loan"]);

export const transactionTypeLabels: Record<string, string> = {
  expense: "Chiqim",
  income: "Kirim",
  transfer: "Ichki o‘tkazma",
  loan: "Qarz berish",
  debt_repayment: "Qarz qaytarish",
  refund: "Pulni qaytarib olish",
};

export function isInflow(row: ExportTransactionRecord) {
  return inflowTypes.has(row.transactionType);
}

export function isOutflow(row: ExportTransactionRecord) {
  return outflowTypes.has(row.transactionType)
    && !(row.transactionType === "expense" && row.isZeroConsumption);
}

export function summarizeTransactions(rows: ExportTransactionRecord[]): CashFlowSummary {
  const totalIncome = rows.reduce((sum, row) => sum + (isInflow(row) ? row.amount : 0), 0);
  const totalExpense = rows.reduce((sum, row) => sum + (isOutflow(row) ? row.amount : 0), 0);
  const expenseDays = new Set(rows.filter(isOutflow).map((row) => row.transactionDate));
  return {
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
    transactionCount: rows.length,
    activeExpenseDays: expenseDays.size,
    averageDailyExpense: expenseDays.size ? totalExpense / expenseDays.size : 0,
    transferTotal: rows.reduce((sum, row) => sum + (row.transactionType === "transfer" ? row.amount : 0), 0),
  };
}

const colors = {
  navy: "102A56",
  blue: "1E40AF",
  paleBlue: "EAF2FF",
  green: "DCFCE7",
  darkGreen: "166534",
  red: "FEE2E2",
  darkRed: "991B1B",
  gray: "F3F4F6",
  muted: "64748B",
  white: "FFFFFF",
};
const moneyFormat = '#,##0 "so‘m";[Red](#,##0 "so‘m");-';
const percentFormat = "0.0%";
const dateFormat = "dd.mm.yyyy";

function dateValue(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function dateTimeValue(value: string) {
  return new Date(value);
}

function styleTitle(sheet: ExcelJS.Worksheet, title: string, lastColumn: string) {
  sheet.mergeCells(`A2:${lastColumn}2`);
  const cell = sheet.getCell("A2");
  cell.value = title;
  cell.font = { name: "Arial", size: 16, bold: true, color: { argb: colors.navy } };
  cell.alignment = { vertical: "middle" };
  sheet.getRow(2).height = 28;
}

function finishSheet(sheet: ExcelJS.Worksheet) {
  sheet.properties.defaultRowHeight = 20;
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  sheet.headerFooter.oddFooter = "STable · &D · &P / &N";
  sheet.eachRow((row) => row.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { ...cell.font, name: "Arial", size: cell.font?.size ?? 10 };
    cell.alignment = { ...cell.alignment, vertical: "middle" };
  }));
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

export function buildTransactionsWorkbook(rows: ExportTransactionRecord[], generatedAt = new Date()) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "STable";
  workbook.company = "STable";
  workbook.subject = "Kirim va chiqimlar hisoboti";
  workbook.title = "STable moliyaviy hisoboti";
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  workbook.calcProperties.fullCalcOnLoad = true;

  const summary = summarizeTransactions(rows);
  const dates = rows.map((row) => row.transactionDate).sort();
  const periodStart = dates[0] ? dateValue(dates[0]) : null;
  const periodEnd = dates.at(-1) ? dateValue(dates.at(-1)!) : null;

  const overview = workbook.addWorksheet("Xulosa", { views: [{ showGridLines: false, state: "frozen", ySplit: 4 }], properties: { tabColor: { argb: colors.blue } } });
  styleTitle(overview, "STable moliyaviy hisoboti", "F");
  overview.getCell("A3").value = "Hisobot davri";
  overview.getCell("B3").value = periodStart;
  overview.getCell("C3").value = periodEnd;
  overview.getCell("D3").value = "Yaratilgan vaqt";
  overview.getCell("E3").value = generatedAt;
  overview.getCell("B3").numFmt = dateFormat;
  overview.getCell("C3").numFmt = dateFormat;
  overview.getCell("E3").numFmt = "dd.mm.yyyy hh:mm";

  overview.getRow(5).values = ["Ko‘rsatkich", "Qiymat", "Izoh"];
  const metrics: Array<[string, number, string]> = [
    ["Jami kirim", summary.totalIncome, "Kirim, qaytarilgan pul va qaytarilgan qarz"],
    ["Jami chiqim", summary.totalExpense, "Chiqim va berilgan qarz; 0 so‘mlik yozuvlar hisoblanmaydi"],
    ["Sof pul oqimi", summary.netCashFlow, "Jami kirim − jami chiqim"],
    ["Kunlik o‘rtacha chiqim", summary.averageDailyExpense, `${summary.activeExpenseDays} faol chiqim kuni bo‘yicha`],
    ["Ichki o‘tkazmalar", summary.transferTotal, "Naqd va karta o‘rtasidagi o‘tkazmalar"],
    ["Amallar soni", summary.transactionCount, "Barcha yozuvlar, jumladan ichki o‘tkazmalar"],
  ];
  metrics.forEach((item, index) => { overview.getRow(6 + index).values = item; });
  overview.getRow(5).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.navy } }; cell.font = { bold: true, color: { argb: colors.white } }; });
  [6, 7, 8, 9, 10].forEach((rowNumber) => { overview.getCell(`B${rowNumber}`).numFmt = moneyFormat; });
  overview.getCell("B6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.green } };
  overview.getCell("B7").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.red } };
  overview.getCell("B8").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.paleBlue } };
  overview.columns = [{ width: 28 }, { width: 22 }, { width: 52 }, { width: 22 }, { width: 23 }, { width: 3 }];
  finishSheet(overview);

  const categoryMap = new Map<string, { income: number; expense: number; count: number }>();
  rows.forEach((row) => {
    const name = row.rootCategory || "Kategoriyasiz";
    const item = categoryMap.get(name) ?? { income: 0, expense: 0, count: 0 };
    if (isInflow(row)) item.income += row.amount;
    if (isOutflow(row)) item.expense += row.amount;
    item.count += 1;
    categoryMap.set(name, item);
  });
  const categoryRows = [...categoryMap].map(([name, item]) => [name, item.income, item.expense, item.income - item.expense, item.count, summary.totalExpense ? item.expense / summary.totalExpense : 0])
    .sort((a, b) => Number(b[2]) - Number(a[2]));
  const categories = workbook.addWorksheet("Kategoriyalar", { views: [{ showGridLines: false, state: "frozen", ySplit: 4 }], properties: { tabColor: { argb: "7C3AED" } } });
  styleTitle(categories, "Umumiy kategoriyalar kesimidagi hisobot", "F");
  categories.addTable({ name: "KategoriyalarHisoboti", ref: "A4", headerRow: true, totalsRow: true, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: [
    { name: "Umumiy kategoriya", totalsRowLabel: "Jami" }, { name: "Kirim", totalsRowFunction: "sum" }, { name: "Chiqim", totalsRowFunction: "sum" }, { name: "Sof natija", totalsRowFunction: "sum" }, { name: "Amallar soni", totalsRowFunction: "sum" }, { name: "Chiqimdagi ulushi", totalsRowFunction: "sum" },
  ], rows: categoryRows });
  categories.columns = [{ width: 34 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 16 }, { width: 19 }];
  [2, 3, 4].forEach((number) => { categories.getColumn(number).numFmt = moneyFormat; });
  categories.getColumn(6).numFmt = percentFormat;
  finishSheet(categories);

  const monthMap = new Map<string, { income: number; expense: number; count: number }>();
  rows.forEach((row) => {
    const key = monthKey(row.transactionDate);
    const item = monthMap.get(key) ?? { income: 0, expense: 0, count: 0 };
    if (isInflow(row)) item.income += row.amount;
    if (isOutflow(row)) item.expense += row.amount;
    item.count += 1;
    monthMap.set(key, item);
  });
  const monthlyRows = [...monthMap].sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [dateValue(`${key}-01`), item.income, item.expense, item.income - item.expense, item.count]);
  const monthly = workbook.addWorksheet("Oylar kesimi", { views: [{ showGridLines: false, state: "frozen", ySplit: 4 }], properties: { tabColor: { argb: "0EA5E9" } } });
  styleTitle(monthly, "Oylar bo‘yicha pul oqimi", "E");
  monthly.addTable({ name: "OylarHisoboti", ref: "A4", headerRow: true, totalsRow: true, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: [
    { name: "Oy", totalsRowLabel: "Jami" }, { name: "Kirim", totalsRowFunction: "sum" }, { name: "Chiqim", totalsRowFunction: "sum" }, { name: "Sof natija", totalsRowFunction: "sum" }, { name: "Amallar soni", totalsRowFunction: "sum" },
  ], rows: monthlyRows });
  monthly.columns = [{ width: 18 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 18 }];
  monthly.getColumn(1).numFmt = "mmmm yyyy";
  [2, 3, 4].forEach((number) => { monthly.getColumn(number).numFmt = moneyFormat; });
  finishSheet(monthly);

  const accountMap = new Map<string, { income: number; expense: number; transferIn: number; transferOut: number; count: number }>();
  const accountItem = (name: string) => accountMap.get(name) ?? { income: 0, expense: 0, transferIn: 0, transferOut: 0, count: 0 };
  rows.forEach((row) => {
    const sourceName = row.accountName || "Hisobsiz";
    const source = accountItem(sourceName);
    if (isInflow(row)) source.income += row.amount;
    if (isOutflow(row)) source.expense += row.amount;
    if (row.transactionType === "transfer") source.transferOut += row.amount;
    source.count += 1;
    accountMap.set(sourceName, source);
    if (row.transactionType === "transfer" && row.targetAccountName) {
      const target = accountItem(row.targetAccountName);
      target.transferIn += row.amount;
      target.count += 1;
      accountMap.set(row.targetAccountName, target);
    }
  });
  const accountRows = [...accountMap].map(([name, item]) => [name, item.income, item.expense, item.transferIn, item.transferOut, item.income - item.expense + item.transferIn - item.transferOut, item.count])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "uz"));
  const accounts = workbook.addWorksheet("Hisoblar", { views: [{ showGridLines: false, state: "frozen", ySplit: 4 }], properties: { tabColor: { argb: "059669" } } });
  styleTitle(accounts, "Hisoblar bo‘yicha mablag‘ harakati", "G");
  accounts.addTable({ name: "HisoblarHisoboti", ref: "A4", headerRow: true, totalsRow: true, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: [
    { name: "Hisob", totalsRowLabel: "Jami" }, { name: "Kirim", totalsRowFunction: "sum" }, { name: "Chiqim", totalsRowFunction: "sum" }, { name: "O‘tkazma keldi", totalsRowFunction: "sum" }, { name: "O‘tkazma chiqdi", totalsRowFunction: "sum" }, { name: "Hisobdagi sof o‘zgarish", totalsRowFunction: "sum" }, { name: "Amallar soni", totalsRowFunction: "sum" },
  ], rows: accountRows });
  accounts.columns = [{ width: 25 }, { width: 19 }, { width: 19 }, { width: 19 }, { width: 19 }, { width: 24 }, { width: 17 }];
  [2, 3, 4, 5, 6].forEach((number) => { accounts.getColumn(number).numFmt = moneyFormat; });
  finishSheet(accounts);

  const detail = workbook.addWorksheet("Barcha amallar", { views: [{ showGridLines: false, state: "frozen", ySplit: 4 }], properties: { tabColor: { argb: "475569" } } });
  styleTitle(detail, "Kirim va chiqimlarning to‘liq tafsiloti", "P");
  const detailRows = rows.map((row) => [
    dateValue(row.transactionDate), transactionTypeLabels[row.transactionType] ?? "Boshqa", row.rootCategory || "Kategoriyasiz", row.detailCategory || "—",
    row.amount, row.currency, row.accountName || "—", row.targetAccountName || "—", row.isZeroConsumption ? "Ha" : "Yo‘q", row.note || "—", row.location || "—",
    dateTimeValue(row.createdAt), dateTimeValue(row.updatedAt), row.id,
  ]);
  detail.addTable({ name: "BarchaAmallar", ref: "A4", headerRow: true, totalsRow: true, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: [
    { name: "Sana", totalsRowLabel: "Jami" }, { name: "Amal turi" }, { name: "Umumiy kategoriya" }, { name: "Batafsil kategoriya" }, { name: "Summa", totalsRowFunction: "sum" }, { name: "Valyuta" }, { name: "Manba hisob" }, { name: "Qabul qiluvchi hisob" }, { name: "0 so‘mlik yozuv" }, { name: "Izoh" }, { name: "Manzil" }, { name: "Yaratilgan vaqt" }, { name: "Yangilangan vaqt" }, { name: "Yozuv identifikatori" },
  ], rows: detailRows });
  detail.columns = [14, 19, 28, 28, 19, 11, 20, 22, 17, 36, 25, 22, 22, 38].map((width) => ({ width }));
  detail.getColumn(1).numFmt = dateFormat;
  detail.getColumn(5).numFmt = moneyFormat;
  detail.getColumn(12).numFmt = "dd.mm.yyyy hh:mm";
  detail.getColumn(13).numFmt = "dd.mm.yyyy hh:mm";
  detail.getRows(5, detailRows.length)?.forEach((row) => {
    const type = String(row.getCell(2).value ?? "");
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: type === "Kirim" || type.includes("qaytar") ? colors.green : type === "Chiqim" || type === "Qarz berish" ? colors.red : colors.paleBlue } };
  });
  finishSheet(detail);

  const methodology = workbook.addWorksheet("Izoh", { views: [{ showGridLines: false }], properties: { tabColor: { argb: "94A3B8" } } });
  styleTitle(methodology, "Hisobotni o‘qish bo‘yicha izoh", "D");
  const notes = [
    ["Kirim", "Kirim, pulni qaytarib olish va qarz qaytarish yozuvlari yig‘indisi."],
    ["Chiqim", "Oddiy chiqim va qarz berish yozuvlari yig‘indisi. Uyda tayyorlangan kabi 0 so‘mlik yozuvlar pul hisobiga kirmaydi."],
    ["Ichki o‘tkazma", "Naqd va karta o‘rtasidagi konvertatsiya. U jami kirim yoki chiqimni o‘zgartirmaydi."],
    ["Kunlik o‘rtacha", "Jami chiqim faqat chiqim qayd etilgan faol kunlar soniga bo‘linadi."],
    ["Umumiy kategoriya", "Masalan, Metro yoki Avtobus emas, ularning umumiy Transport kategoriyasi."],
  ];
  methodology.addTable({ name: "HisobotIzohi", ref: "A4", headerRow: true, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: [{ name: "Atama" }, { name: "Ta’rif" }], rows: notes });
  methodology.columns = [{ width: 28 }, { width: 95 }, { width: 3 }, { width: 3 }];
  methodology.getColumn(2).alignment = { wrapText: true, vertical: "top" };
  finishSheet(methodology);

  return workbook;
}

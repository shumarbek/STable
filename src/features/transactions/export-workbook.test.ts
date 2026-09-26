import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildTransactionsWorkbook, summarizeTransactions, type ExportTransactionRecord } from "@/features/transactions/export-workbook";

const base: Omit<ExportTransactionRecord, "id" | "transactionType" | "amount" | "transactionDate"> = {
  createdAt: "2026-09-20T08:00:00.000Z",
  updatedAt: "2026-09-20T08:00:00.000Z",
  currency: "UZS", isZeroConsumption: false, rootCategory: "Oziq-ovqat", detailCategory: "Tushlik",
  accountName: "Naqd", targetAccountName: "", note: "", location: "",
};

function row(id: string, transactionType: string, amount: number, transactionDate: string, extra: Partial<ExportTransactionRecord> = {}): ExportTransactionRecord {
  return { ...base, id, transactionType, amount, transactionDate, ...extra };
}

describe("Excel hisoboti", () => {
  const rows = [
    row("1", "income", 1_000_000, "2026-09-01"), row("2", "refund", 50_000, "2026-09-02"),
    row("3", "debt_repayment", 100_000, "2026-09-03"), row("4", "expense", 200_000, "2026-09-03"),
    row("5", "loan", 150_000, "2026-09-04"), row("6", "expense", 0, "2026-09-05", { isZeroConsumption: true }),
    row("7", "transfer", 300_000, "2026-09-05", { targetAccountName: "Karta" }),
  ];

  it("kirim, chiqim va ichki o‘tkazmani to‘g‘ri ajratadi", () => {
    expect(summarizeTransactions(rows)).toEqual({ totalIncome: 1_150_000, totalExpense: 350_000, netCashFlow: 800_000, transactionCount: 7, activeExpenseDays: 2, averageDailyExpense: 175_000, transferTotal: 300_000 });
  });

  it("professional ish kitobining barcha bo‘limlarini yaratadi", async () => {
    const workbook = buildTransactionsWorkbook(rows, new Date("2026-09-26T10:00:00.000Z"));
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Xulosa", "Kategoriyalar", "Oylar kesimi", "Hisoblar", "Barcha amallar", "Izoh"]);
    expect(workbook.getWorksheet("Xulosa")?.getCell("B6").value).toBe(1_150_000);
    expect(workbook.getWorksheet("Xulosa")?.getCell("B7").value).toBe(350_000);
    expect(workbook.getWorksheet("Barcha amallar")?.getCell("B5").value).toBe("Kirim");
    const buffer = await workbook.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(10_000);
    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(buffer);
    expect(reopened.getWorksheet("Hisoblar")?.getCell("A5").value).toBe("Karta");
    expect(reopened.getWorksheet("Izoh")?.getCell("B5").value).toContain("qarz qaytarish");
  });
});

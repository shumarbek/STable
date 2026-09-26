import { describe, expect, it } from "vitest";
import { balanceConversionSchema } from "@/lib/validators/account";

describe("balanceConversionSchema", () => {
  it("300 000 so‘mlik konvertatsiyani qabul qiladi", () => {
    const result = balanceConversionSchema.safeParse({
      direction: "cash_to_card",
      amount: 300_000,
      conversionDate: "2026-09-26",
      note: "Kartani to‘ldirish",
      idempotencyKey: "b3578557-81ba-46ad-8676-fd0bc2db79bb",
    });
    expect(result.success).toBe(true);
  });

  it("musbat bo‘lmagan summani rad etadi", () => {
    const result = balanceConversionSchema.safeParse({
      direction: "card_to_cash",
      amount: 0,
      conversionDate: "2026-09-26",
      idempotencyKey: "b3578557-81ba-46ad-8676-fd0bc2db79bb",
    });
    expect(result.success).toBe(false);
  });
});

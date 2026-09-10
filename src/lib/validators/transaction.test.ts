import { describe, it, expect } from "vitest";
import { transactionFormSchema } from "./transaction";

const validBase = {
  transactionType: "expense" as const,
  accountId: "11111111-1111-4111-8111-111111111111",
  amount: 38000,
  transactionDate: "2020-01-01", // safely in the past regardless of test run date
};

describe("transactionFormSchema", () => {
  it("accepts a valid basic expense", () => {
    const result = transactionFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects a future transaction date", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const result = transactionFormSchema.safeParse({
      ...validBase,
      transactionDate: futureDate.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = transactionFormSchema.safeParse({ ...validBase, amount: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects a zero amount unless isZeroConsumption is true", () => {
    const result = transactionFormSchema.safeParse({ ...validBase, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts a zero amount when isZeroConsumption is true (home-cooked meal)", () => {
    const result = transactionFormSchema.safeParse({
      ...validBase,
      amount: 0,
      isZeroConsumption: true,
    });
    expect(result.success).toBe(true);
  });

  it("requires a distinct transferAccountId for transfer transactions", () => {
    const result = transactionFormSchema.safeParse({
      ...validBase,
      transactionType: "transfer",
      transferAccountId: validBase.accountId, // same as source — invalid
    });
    expect(result.success).toBe(false);
  });

  it("accepts a transfer with a different target account", () => {
    const result = transactionFormSchema.safeParse({
      ...validBase,
      transactionType: "transfer",
      transferAccountId: "22222222-2222-4222-8222-222222222222",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a transfer with no target account", () => {
    const result = transactionFormSchema.safeParse({
      ...validBase,
      transactionType: "transfer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed account ids (defense against malicious input)", () => {
    const result = transactionFormSchema.safeParse({
      ...validBase,
      accountId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes longer than 500 characters", () => {
    const result = transactionFormSchema.safeParse({
      ...validBase,
      note: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

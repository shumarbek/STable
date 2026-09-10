import { describe, it, expect } from "vitest";
import { toAmountNumber, formatMoney, formatSignedMoney, formatPercentageChange } from "./money";

describe("toAmountNumber", () => {
  it("returns 0 for null/undefined", () => {
    expect(toAmountNumber(null)).toBe(0);
    expect(toAmountNumber(undefined)).toBe(0);
  });

  it("parses numeric strings (as returned by Postgres numeric columns)", () => {
    expect(toAmountNumber("38000")).toBe(38000);
    expect(toAmountNumber("38000.50")).toBe(38000.5);
  });

  it("passes through numbers unchanged", () => {
    expect(toAmountNumber(1500)).toBe(1500);
  });

  it("returns 0 for non-numeric strings instead of NaN", () => {
    expect(toAmountNumber("not-a-number")).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats UZS with thousands separators and so'm suffix", () => {
    expect(formatMoney(38000)).toBe("38 000 so'm");
    expect(formatMoney(1847500)).toBe("1 847 500 so'm");
  });

  it("formats zero correctly (home-cooked meal case)", () => {
    expect(formatMoney(0)).toBe("0 so'm");
  });

  it("rounds fractional amounts for display", () => {
    expect(formatMoney(1000.6)).toBe("1 001 so'm");
  });

  it("uses the given currency suffix for non-UZS", () => {
    expect(formatMoney(100, "USD")).toBe("100 USD");
  });
});

describe("formatSignedMoney", () => {
  it("prefixes positive amounts with +", () => {
    expect(formatSignedMoney(70000)).toBe("+70 000 so'm");
  });

  it("does not double-prefix negative amounts (Intl already adds -)", () => {
    expect(formatSignedMoney(-30000)).toBe("-30 000 so'm");
  });
});

describe("formatPercentageChange", () => {
  it("returns an em dash for null/undefined (no previous period data)", () => {
    expect(formatPercentageChange(null)).toBe("—");
    expect(formatPercentageChange(undefined)).toBe("—");
  });

  it("prefixes positive change with +", () => {
    expect(formatPercentageChange(14.2)).toBe("+14.2%");
  });

  it("keeps negative sign for decreases", () => {
    expect(formatPercentageChange(-8.7)).toBe("-8.7%");
  });
});

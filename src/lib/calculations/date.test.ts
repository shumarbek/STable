import { describe, it, expect } from "vitest";
import {
  toIsoDate,
  weekBoundsFor,
  monthBoundsFor,
  previousPeriod,
  uzWeekdayShort,
  uzMonthName,
} from "./date";

describe("toIsoDate", () => {
  it("formats a Date as YYYY-MM-DD with zero-padding", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("weekBoundsFor", () => {
  it("returns Monday-Sunday bounds when given a Wednesday", () => {
    // 2026-09-09 is a Wednesday
    const { start, end } = weekBoundsFor("2026-09-09");
    expect(start).toBe("2026-09-07"); // Monday
    expect(end).toBe("2026-09-13"); // Sunday
  });

  it("handles a Sunday input correctly (week ends on itself)", () => {
    // 2026-09-13 is a Sunday
    const { start, end } = weekBoundsFor("2026-09-13");
    expect(start).toBe("2026-09-07");
    expect(end).toBe("2026-09-13");
  });

  it("handles a Monday input correctly (week starts on itself)", () => {
    const { start, end } = weekBoundsFor("2026-09-07");
    expect(start).toBe("2026-09-07");
    expect(end).toBe("2026-09-13");
  });
});

describe("monthBoundsFor", () => {
  it("returns first and last day of the month", () => {
    const { start, end } = monthBoundsFor("2026-02-15");
    expect(start).toBe("2026-02-01");
    expect(end).toBe("2026-02-28"); // 2026 is not a leap year
  });

  it("handles leap years correctly", () => {
    const { end } = monthBoundsFor("2028-02-10");
    expect(end).toBe("2028-02-29");
  });
});

describe("previousPeriod", () => {
  it("returns the immediately preceding period of equal length", () => {
    const { start, end } = previousPeriod("2026-09-07", "2026-09-13");
    expect(start).toBe("2026-08-31");
    expect(end).toBe("2026-09-06");
  });

  it("works for single-day periods", () => {
    const { start, end } = previousPeriod("2026-09-09", "2026-09-09");
    expect(start).toBe("2026-09-08");
    expect(end).toBe("2026-09-08");
  });
});

describe("uzWeekdayShort", () => {
  it("returns the correct Uzbek weekday abbreviation", () => {
    expect(uzWeekdayShort("2026-09-09")).toBe("Chor"); // Wednesday
    expect(uzWeekdayShort("2026-09-07")).toBe("Dush"); // Monday
  });
});

describe("uzMonthName", () => {
  it("returns the correct Uzbek month name for a given index", () => {
    expect(uzMonthName(0)).toBe("Yanvar");
    expect(uzMonthName(8)).toBe("Sentabr");
    expect(uzMonthName(11)).toBe("Dekabr");
  });
});

import { describe, expect, it } from "vitest";
import { formatCurrency, formatPercentage, formatShare } from "./format";

describe("format helpers", () => {
  it("formats currency using provided code", () => {
    expect(formatCurrency(1234.56, "usd")).toBe("$1,234.56");
    expect(formatCurrency(0.000123, "btc")).toBe("BTC 0.000123");
  });

  it("formats percentages with sign", () => {
    expect(formatPercentage(2.345)).toBe("+2.35%");
    expect(formatPercentage(-5.5)).toBe("-5.50%");
    expect(formatPercentage(null)).toBe("N/A");
  });

  it("formats share ratios", () => {
    expect(formatShare(0.256)).toBe("25.60%");
  });
});

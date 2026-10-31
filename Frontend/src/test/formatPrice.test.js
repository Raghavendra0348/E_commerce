import { describe, it, expect } from "vitest";
import { formatPrice } from "../lib/utils";

describe("formatPrice utility", () => {
  it("formats integer amounts in Indian Rupee format", () => {
    expect(formatPrice(1299)).toBe("₹1,299");
    expect(formatPrice(159900)).toBe("₹1,59,900");
  });

  it("handles 0 amount", () => {
    expect(formatPrice(0)).toBe("₹0");
  });

  it("handles null and undefined gracefully", () => {
    expect(formatPrice(null)).toBe("₹0");
    expect(formatPrice(undefined)).toBe("₹0");
    expect(formatPrice("invalid")).toBe("₹0");
  });
});

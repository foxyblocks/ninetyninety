import { describe, it, expect } from "bun:test";

describe("Example Test Suite", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    const appName = "NinetyNinety";
    expect(appName).toContain("Ninety");
    expect(appName.toLowerCase()).toBe("ninetyninety");
  });
}); 
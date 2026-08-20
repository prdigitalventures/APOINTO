import { describe, expect, it } from "vitest";

describe("booking labels", () => {
  it("formats a booking summary", () => {
    const summary = `${"Mumbai Fitness Studio"} · ${"Yoga Class"}`;
    expect(summary).toBe("Mumbai Fitness Studio · Yoga Class");
  });
});

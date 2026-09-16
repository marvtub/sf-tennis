import { describe, expect, it } from "vitest";

import { formatTimeSince } from "./TimeSince";

describe("formatTimeSince", () => {
  const timestamp = "2026-09-07T11:00:00.000Z";

  it.each([
    [59_500, "59s ago"],
    [59 * 60_000 + 29_000, "59m ago"],
    [59 * 60_000 + 30_000, "59m ago"],
    [60 * 60_000, "1h ago"],
  ])("reports only completed units after %i milliseconds", (elapsed, label) => {
    const now = Date.parse(timestamp) + elapsed;

    expect(formatTimeSince(timestamp, now)).toBe(label);
  });

  it("clamps future update times to zero seconds", () => {
    const now = Date.parse("2026-09-07T12:00:00.000Z");

    expect(formatTimeSince("2026-09-07T12:00:30.000Z", now)).toBe(
      "0s ago"
    );
  });

  it("uses a stable fallback for an invalid update time", () => {
    expect(formatTimeSince("not-a-date")).toBe("recently");
  });
});

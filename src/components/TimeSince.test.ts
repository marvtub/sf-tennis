import { describe, expect, it } from "vitest";

import { formatTimeSince } from "./TimeSince";

describe("formatTimeSince", () => {
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

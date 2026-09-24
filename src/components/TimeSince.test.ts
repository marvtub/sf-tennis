// @vitest-environment jsdom

import { act, createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { formatTimeSince, TimeSince } from "./TimeSince";

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

describe("TimeSince", () => {
  it("hydrates without changing its initial time-dependent label", async () => {
    const timestamp = "2026-09-07T11:00:00.000Z";
    const recoverableErrors: unknown[] = [];
    const container = document.createElement("div");
    let root: ReturnType<typeof hydrateRoot> | undefined;

    vi.useFakeTimers();

    try {
      vi.setSystemTime(Date.parse(timestamp) + 5_000);
      container.innerHTML = renderToString(
        createElement(TimeSince, { isoString: timestamp }),
      );

      vi.advanceTimersByTime(1_000);

      await act(async () => {
        root = hydrateRoot(
          container,
          createElement(TimeSince, { isoString: timestamp }),
          {
            onRecoverableError: (error) => recoverableErrors.push(error),
          },
        );
      });

      expect(recoverableErrors).toEqual([]);
      expect(container.textContent).toBe("Updated 6s ago");
    } finally {
      if (root) {
        await act(async () => root?.unmount());
      }
      vi.useRealTimers();
    }
  });
});

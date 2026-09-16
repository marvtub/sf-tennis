// @vitest-environment jsdom

import { act, createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatTimeSince, TimeSince } from "./TimeSince";

afterEach(() => {
  vi.useRealTimers();
});

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

  it("hydrates without changing time-dependent server content", async () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-09-07T12:00:05.000Z");

    const props = { isoString: "2026-09-07T12:00:00.000Z" };
    const container = document.createElement("div");
    container.innerHTML = renderToString(createElement(TimeSince, props));

    vi.setSystemTime("2026-09-07T12:00:06.000Z");

    const hydrationErrors: unknown[] = [];
    const root = hydrateRoot(container, createElement(TimeSince, props), {
      onRecoverableError: (error) => hydrationErrors.push(error),
    });

    await act(async () => {});

    expect(hydrationErrors).toEqual([]);
    expect(container.textContent).toBe("Updated 6s ago");

    await act(async () => root.unmount());
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterBar } from "./FilterBar";

afterEach(() => {
  vi.useRealTimers();
});

describe("FilterBar date labels", () => {
  it("labels the next Los Angeles calendar date as Tomorrow after fall-back", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T07:30:00.000Z"));

    const markup = renderToStaticMarkup(
      <FilterBar
        filter={{ date: null, timeFrom: null, timeTo: null }}
        onChange={() => {}}
        availableDates={["2026-11-02"]}
      />,
    );

    expect(markup).toContain(">Tomorrow</option>");
  });
});

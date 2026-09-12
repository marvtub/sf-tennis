import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FilterBar } from "./FilterBar";

describe("FilterBar", () => {
  it("gives each filter control a distinct accessible name", () => {
    const markup = renderToStaticMarkup(
      <FilterBar
        filter={{ date: null, timeFrom: null, timeTo: null }}
        onChange={() => {}}
        availableDates={[]}
      />,
    );

    expect(markup).toContain(
      '<label class="sr-only" for="availability-filter-day">Day</label>',
    );
    expect(markup).toContain('<select id="availability-filter-day"');
    expect(markup).toContain(
      '<label class="sr-only" for="availability-filter-start-time">Start time</label>',
    );
    expect(markup).toContain('<select id="availability-filter-start-time"');
    expect(markup).toContain(
      '<label class="sr-only" for="availability-filter-end-time">End time</label>',
    );
    expect(markup).toContain('<select id="availability-filter-end-time"');
  });
});

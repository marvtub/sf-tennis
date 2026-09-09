import { describe, expect, it } from "vitest";

import { shouldCacheTravelTimesResponse } from "./useTravelTimes";

describe("shouldCacheTravelTimesResponse", () => {
  it("does not cache responses marked no-store", () => {
    const response = new Response(null, {
      headers: { "Cache-Control": "private, no-store" },
    });

    expect(shouldCacheTravelTimesResponse(response)).toBe(false);
  });

  it("allows caching for the normal directions response", () => {
    const response = new Response(null, {
      headers: { "Cache-Control": "s-maxage=86400" },
    });

    expect(shouldCacheTravelTimesResponse(response)).toBe(true);
  });
});

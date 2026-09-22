import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addCalendarDays,
  availabilityWindow,
  fetchCourtsAvailability,
  parseSiteSlots,
} from "./availability-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseSiteSlots", () => {
  it("flattens per-site payloads into sorted slots", () => {
    expect(
      parseSiteSlots({
        data: {
          "2026-09-23": { "13:30:00": {}, "07:30:00": {} },
          "2026-09-22": { "10:30:00": {} },
        },
      })
    ).toEqual([
      { datetime: "2026-09-22 10:30", date: "2026-09-22", time: "10:30" },
      { datetime: "2026-09-23 07:30", date: "2026-09-23", time: "07:30" },
      { datetime: "2026-09-23 13:30", date: "2026-09-23", time: "13:30" },
    ]);
  });

  it("returns no slots for empty or missing payloads", () => {
    expect(parseSiteSlots({})).toEqual([]);
    expect(parseSiteSlots({ data: {} })).toEqual([]);
  });
});

describe("availabilityWindow", () => {
  it("covers a 7-day window starting today", () => {
    const { startDate, endDate } = availabilityWindow(new Date("2026-09-22T12:00:00Z"));
    expect(startDate).toBe("2026-09-22");
    expect(endDate).toBe("2026-09-29");
    expect(addCalendarDays("2026-12-28", 7)).toBe("2027-01-04");
  });

  it.each([
    ["spring forward", "2026-03-08T07:30:00Z", "2026-03-07", "2026-03-14"],
    ["fall back", "2026-11-01T07:30:00Z", "2026-11-01", "2026-11-08"],
  ])("requests seven Los Angeles calendar days across %s", (_t, now, expectedStart, expectedEnd) => {
    const { startDate, endDate } = availabilityWindow(new Date(now));
    expect(startDate).toBe(expectedStart);
    expect(endDate).toBe(expectedEnd);
  });
});

describe("fetchCourtsAvailability", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON accept and merges slots per court", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { "2026-09-22": { "10:30:00": {} } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCourtsAvailability(["c1", "c2"], "2026-09-22", "2026-09-29");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.rec.us/v1/sites/c1/availability?startDate=2026-09-22&endDate=2026-09-29",
      { headers: { Accept: "application/json" } }
    );
    expect(result.get("c1")).toEqual([
      { datetime: "2026-09-22 10:30", date: "2026-09-22", time: "10:30" },
    ]);
    expect(result.get("c2")).toEqual([]);
  });

  it("treats failed courts as empty instead of throwing", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error("boom");
      })
      .mockImplementationOnce(async () => ({ ok: false, status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCourtsAvailability(["bad", "forbidden"], "2026-09-22", "2026-09-29");

    expect(result.get("bad")).toEqual([]);
    expect(result.get("forbidden")).toEqual([]);
  });
});

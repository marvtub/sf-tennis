import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchAllCourts } from "./recus";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function bulkResponse(courtIds: string[]) {
  return [
    {
      location: {
        id: "location-1",
        name: "Test courts",
        lat: "37.77",
        lng: "-122.42",
        courts: courtIds.map((id, index) => ({
          id,
          courtNumber: String(index + 1),
          sports: [{ sportId: "tennis" }],
          config: { pricing: { default: { cents: 0 } } },
          allowedReservationDurations: { minutes: [60] },
          defaultReservationWindowDays: 7,
          reservationReleaseTimeLocal: "08:00:00",
        })),
      },
      formattedAddress: "1 Test St",
      hoursOfOperation: "",
      accessInfo: "",
      gettingThereInfo: "",
      images: {},
    },
  ];
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchAllCourts", () => {
  it("treats a successful response with no slots as confirmed full availability", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(bulkResponse(["court-1"])))
      .mockResolvedValueOnce(jsonResponse({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    const locations = await fetchAllCourts("test-organization");

    expect(locations[0].availabilityStatus).toBe("full");
    expect(locations[0].courts[0].availableSlots).toEqual([]);
  });

  it("rejects mixed per-court results instead of reporting a failed court as full", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(bulkResponse(["court-empty", "court-failed"]))
      )
      .mockResolvedValueOnce(jsonResponse({ data: {} }))
      .mockResolvedValueOnce(
        new Response(null, { status: 500, statusText: "Internal Server Error" })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAllCourts("test-organization")).rejects.toThrow(
      "rec.us per-site API error for court court-failed"
    );
  });

  it.each([
    ["spring forward", "2026-03-08T07:30:00Z", "2026-03-07", "2026-03-14"],
    ["fall back", "2026-11-01T07:30:00Z", "2026-11-01", "2026-11-08"],
  ])(
    "requests seven Los Angeles calendar days across %s",
    async (_transition, now, expectedStart, expectedEnd) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now));

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(bulkResponse(["court-1"])))
        .mockResolvedValueOnce(jsonResponse({ data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await fetchAllCourts("test-organization");

      const availabilityUrl = new URL(String(fetchMock.mock.calls[1][0]));
      expect(availabilityUrl.searchParams.get("startDate")).toBe(expectedStart);
      expect(availabilityUrl.searchParams.get("endDate")).toBe(expectedEnd);
    }
  );
});

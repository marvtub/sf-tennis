import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAllCourts } from "./recus";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const DETAIL = (overrides = {}) => ({
  location: {
    id: "loc-1",
    name: "Test Location",
    lat: "37.77",
    lng: "-122.42",
    formattedAddress: "1 Test St",
    hoursOfOperation: "7am-7pm",
    accessInfo: "Public",
    gettingThereInfo: "Walk",
    images: {
      detail: { url: "https://example.com/detail.jpg" },
      thumbnail: { url: "https://example.com/thumb.jpg" },
    },
    courts: [
      {
        id: "court-1",
        courtNumber: "Court 1",
        sports: [{ sportId: "sport-tennis" }],
        config: { pricing: { default: { type: "perHour", cents: 500 } } },
        allowedReservationDurations: { minutes: [60, 90] },
        defaultReservationWindowDays: 7,
        reservationReleaseTimeLocal: "08:00:00",
        archivedAt: null,
      },
      {
        id: "court-archived",
        courtNumber: "Old Court",
        sports: [{ sportId: "sport-tennis" }],
        archivedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    ...overrides,
  },
  distance: null,
});

function mockDetailFetch(handler: (url: string) => { status: number; body?: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      const { status, body } = handler(url);
      return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? "OK" : "Error",
        json: async () => body,
      };
    })
  );
}

describe("fetchAllCourts", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("maps location details to metadata with empty slots", async () => {
    mockDetailFetch(() => ({ status: 200, body: DETAIL() }));

    const [loc] = await fetchAllCourts("san-francisco-rec-park");

    expect(loc.id).toBe("loc-1");
    expect(loc.name).toBe("Test Location");
    expect(loc.lat).toBe(37.77);
    expect(loc.imageUrl).toBe("https://example.com/detail.jpg");
    // Archived courts are dropped; live slots arrive client-side.
    expect(loc.courts.map((c) => c.id)).toEqual(["court-1"]);
    expect(loc.courts[0]).toMatchObject({
      courtNumber: "Court 1",
      sportId: "sport-tennis",
      priceCentsPerHour: 500,
      allowedDurations: [60, 90],
      availableSlots: [],
      bookingUrl: "https://www.rec.us/locations/loc-1?courtId=court-1&tab=calendar",
    });
    expect(loc.availabilityStatus).toBe("full");
  });

  it("skips failing locations instead of failing the city", async () => {
    const { CITIES } = await import("./constants");
    const failingId = CITIES.sf.locationIds[0];
    mockDetailFetch((url) =>
      url.includes(failingId) ? { status: 403 } : { status: 200, body: DETAIL() }
    );

    const locations = await fetchAllCourts("san-francisco-rec-park");

    expect(locations).toHaveLength(CITIES.sf.locationIds.length - 1);
    expect(vi.mocked(console.warn)).toHaveBeenCalled();
  });

  it("throws when all locations fail", async () => {
    mockDetailFetch(() => ({ status: 403 }));
    await expect(fetchAllCourts("san-francisco-rec-park")).rejects.toThrow(
      "all location detail requests failed"
    );
  });

  it("falls back to the default city for unknown slugs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => DETAIL(),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAllCourts("no-such-city");

    expect(fetchMock).toHaveBeenCalled();
    const firstUrl = String(fetchMock.mock.calls[0][0]);
    expect(firstUrl).toMatch(/^https:\/\/api\.rec\.us\/v1\/locations\/[0-9a-f-]{36}\?publishedSites=true$/);
  });
});

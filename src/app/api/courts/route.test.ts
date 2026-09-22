import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { SPORT_ID_PICKLEBALL, SPORT_ID_TENNIS } from "@/lib/constants";
import { fetchAllCourts } from "@/lib/recus";
import type { Court, CourtLocation, TimeSlot } from "@/types";
import { GET } from "./route";

vi.mock("@/lib/recus", () => ({
  fetchAllCourts: vi.fn(),
}));

const TODAY = "2026-06-15";
const TOMORROW = "2026-06-16";

function slot(date: string, time: string): TimeSlot {
  return { datetime: `${date} ${time}:00`, date, time };
}

function court(id: string, sportId: string, availableSlots: TimeSlot[]): Court {
  return {
    id,
    courtNumber: id,
    sportId,
    priceCentsPerHour: 0,
    allowedDurations: [90],
    reservationWindowDays: 7,
    releaseTime: "08:00",
    availableSlots,
    bookingUrl: `https://example.com/${id}`,
  };
}

function location(id: string, courts: Court[]): CourtLocation {
  return {
    id,
    name: id,
    lat: 37.77,
    lng: -122.42,
    address: `${id} address`,
    hoursOfOperation: "8am-8pm",
    accessInfo: "Public",
    gettingThereInfo: "Walk",
    imageUrl: null,
    courts,
    availabilityStatus: "full",
    totalSlotsToday: 0,
    totalSlotsWeek: 0,
  };
}

describe("GET /api/courts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
    vi.mocked(fetchAllCourts).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("filters courts by sport and returns metadata with slots pending", async () => {
    const sf = location("sf-location", [
      court("tennis-court", SPORT_ID_TENNIS, []),
      court("pickleball-court", SPORT_ID_PICKLEBALL, []),
    ]);
    const pickleballOnly = location("pickleball-only", [
      court("pickleball-only-court", SPORT_ID_PICKLEBALL, []),
    ]);

    // The server returns metadata only; browsers fill live slots in.
    vi.mocked(fetchAllCourts).mockResolvedValue([sf, pickleballOnly]);

    const response = await GET(new NextRequest("https://example.com/api/courts"));
    const body = await response.json();

    expect(fetchAllCourts).toHaveBeenCalledOnce();
    expect(fetchAllCourts).toHaveBeenCalledWith("san-francisco-rec-park");
    expect(body).toEqual({
      courts: [
        {
          ...sf,
          courts: [sf.courts[0]],
        },
      ],
      sport: "tennis",
      city: "sf",
      fetchedAt: "2026-06-15T12:00:00.000Z",
      slotsPending: true,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "s-maxage=3600, stale-while-revalidate=86400"
    );
  });

  it("forwards the selected city and returns an empty result contract", async () => {
    vi.mocked(fetchAllCourts).mockResolvedValue([]);

    const response = await GET(
      new NextRequest(
        "https://example.com/api/courts?sport=pickleball&city=mountain-view"
      )
    );

    expect(fetchAllCourts).toHaveBeenCalledWith("city-of-mountain-view");
    expect(await response.json()).toEqual({
      courts: [],
      sport: "pickleball",
      city: "mountain-view",
      fetchedAt: "2026-06-15T12:00:00.000Z",
      slotsPending: true,
    });
  });

  it("returns a generic failure without leaking upstream details", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchAllCourts).mockRejectedValue(
      new Error("secret upstream URL and credentials")
    );

    const response = await GET(new NextRequest("https://example.com/api/courts"));
    const responseText = await response.text();

    expect(response.status).toBe(502);
    expect(JSON.parse(responseText)).toEqual({
      error: "Failed to fetch court availability",
      retryAfterSeconds: 60,
    });
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=30, s-maxage=30"
    );
    expect(responseText).not.toContain("secret upstream URL and credentials");
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to fetch courts:",
      expect.any(Error)
    );
  });

  it("uses the documented defaults when query parameters are omitted", async () => {
    vi.mocked(fetchAllCourts).mockResolvedValue([]);

    const response = await GET(
      new NextRequest("https://example.com/api/courts")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      sport: "tennis",
      city: "sf",
      courts: [],
      slotsPending: true,
    });
    expect(fetchAllCourts).toHaveBeenCalledWith("san-francisco-rec-park");
  });

  it.each([
    ["tennis", "sf", "san-francisco-rec-park"],
    ["pickleball", "mountain-view", "city-of-mountain-view"],
  ])(
    "accepts sport=%s and city=%s",
    async (sport, city, expectedCitySlug) => {
      vi.mocked(fetchAllCourts).mockResolvedValue([]);

      const response = await GET(
        new NextRequest(
          `https://example.com/api/courts?sport=${sport}&city=${city}`
        )
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ sport, city, courts: [] });
      expect(fetchAllCourts).toHaveBeenCalledWith(expectedCitySlug);
    }
  );

  it.each(["pickelball", "", "TENNIS"])(
    "rejects invalid sport=%s without fetching availability",
    async (sport) => {
      const response = await GET(
        new NextRequest(
          `https://example.com/api/courts?sport=${encodeURIComponent(sport)}`
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Invalid 'sport' parameter",
      });
      expect(fetchAllCourts).not.toHaveBeenCalled();
    }
  );

  it.each(["mountainview", "", "toString", "constructor", "__proto__"])(
    "rejects invalid city=%s without fetching availability",
    async (city) => {
      const response = await GET(
        new NextRequest(
          `https://example.com/api/courts?city=${encodeURIComponent(city)}`
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Invalid 'city' parameter",
      });
      expect(fetchAllCourts).not.toHaveBeenCalled();
    }
  );
});

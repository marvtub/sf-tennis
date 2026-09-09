import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { SPORT_ID_PICKLEBALL, SPORT_ID_TENNIS } from "@/lib/constants";
import { fetchAllCourts } from "@/lib/recus";
import { enrichCourtsWithWeather } from "@/lib/weather";
import type { Court, CourtLocation, TimeSlot } from "@/types";
import { GET } from "./route";

vi.mock("@/lib/recus", () => ({
  fetchAllCourts: vi.fn(),
}));

vi.mock("@/lib/weather", () => ({
  enrichCourtsWithWeather: vi.fn(),
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
    vi.mocked(enrichCourtsWithWeather).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("filters courts, recomputes all availability states, and returns enriched results", async () => {
    const available = location("available-location", [
      court("tennis-today", SPORT_ID_TENNIS, [
        slot(TODAY, "09:00"),
        slot(TODAY, "10:00"),
        slot(TOMORROW, "11:00"),
      ]),
      court("pickleball-today", SPORT_ID_PICKLEBALL, [slot(TODAY, "12:00")]),
    ]);
    const later = location("later-location", [
      court("tennis-later", SPORT_ID_TENNIS, [slot(TOMORROW, "13:00")]),
    ]);
    const full = location("full-location", [
      court("tennis-full", SPORT_ID_TENNIS, []),
    ]);
    const noTennis = location("pickleball-only", [
      court("pickleball-only-court", SPORT_ID_PICKLEBALL, [slot(TODAY, "14:00")]),
    ]);

    vi.mocked(fetchAllCourts).mockResolvedValue([available, later, full, noTennis]);
    vi.mocked(enrichCourtsWithWeather).mockImplementation(async (locations) =>
      locations.map((item) => ({ ...item, name: `${item.name} (weather enriched)` }))
    );

    const response = await GET(new NextRequest("https://example.com/api/courts"));
    const body = await response.json();

    expect(fetchAllCourts).toHaveBeenCalledOnce();
    expect(fetchAllCourts).toHaveBeenCalledWith("san-francisco-rec-park");
    expect(enrichCourtsWithWeather).toHaveBeenCalledOnce();
    expect(enrichCourtsWithWeather).toHaveBeenCalledWith([
      {
        ...available,
        courts: [available.courts[0]],
        totalSlotsToday: 2,
        totalSlotsWeek: 3,
        availabilityStatus: "available",
      },
      {
        ...later,
        totalSlotsToday: 0,
        totalSlotsWeek: 1,
        availabilityStatus: "later",
      },
      {
        ...full,
        totalSlotsToday: 0,
        totalSlotsWeek: 0,
        availabilityStatus: "full",
      },
    ]);
    expect(body).toEqual({
      courts: [
        expect.objectContaining({
          id: "available-location",
          name: "available-location (weather enriched)",
          totalSlotsToday: 2,
          totalSlotsWeek: 3,
          availabilityStatus: "available",
        }),
        expect.objectContaining({
          id: "later-location",
          name: "later-location (weather enriched)",
          totalSlotsToday: 0,
          totalSlotsWeek: 1,
          availabilityStatus: "later",
        }),
        expect.objectContaining({
          id: "full-location",
          name: "full-location (weather enriched)",
          totalSlotsToday: 0,
          totalSlotsWeek: 0,
          availabilityStatus: "full",
        }),
      ],
      sport: "tennis",
      city: "sf",
      fetchedAt: "2026-06-15T12:00:00.000Z",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "s-maxage=120, stale-while-revalidate=300"
    );
  });

  it("forwards the selected city and returns an empty result contract", async () => {
    vi.mocked(fetchAllCourts).mockResolvedValue([]);
    vi.mocked(enrichCourtsWithWeather).mockResolvedValue([]);

    const response = await GET(
      new NextRequest(
        "https://example.com/api/courts?sport=pickleball&city=mountain-view"
      )
    );

    expect(fetchAllCourts).toHaveBeenCalledWith("city-of-mountain-view");
    expect(enrichCourtsWithWeather).toHaveBeenCalledWith([]);
    expect(await response.json()).toEqual({
      courts: [],
      sport: "pickleball",
      city: "mountain-view",
      fetchedAt: "2026-06-15T12:00:00.000Z",
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
    });
    expect(responseText).not.toContain("secret upstream URL and credentials");
    expect(enrichCourtsWithWeather).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to fetch courts:",
      expect.any(Error)
    );
  });
});

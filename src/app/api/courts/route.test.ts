import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { fetchAllCourts } from "@/lib/recus";
import { enrichCourtsWithWeather } from "@/lib/weather";
import { GET } from "./route";

vi.mock("@/lib/recus", () => ({
  fetchAllCourts: vi.fn(),
}));

vi.mock("@/lib/weather", () => ({
  enrichCourtsWithWeather: vi.fn(),
}));

describe("GET /api/courts", () => {
  beforeEach(() => {
    vi.mocked(fetchAllCourts).mockReset().mockResolvedValue([]);
    vi.mocked(enrichCourtsWithWeather)
      .mockReset()
      .mockImplementation(async (courts) => courts);
  });

  it("uses the documented defaults when query parameters are omitted", async () => {
    const response = await GET(
      new NextRequest("https://example.com/api/courts")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      sport: "tennis",
      city: "sf",
      courts: [],
    });
    expect(fetchAllCourts).toHaveBeenCalledWith("san-francisco-rec-park");
  });

  it.each([
    ["tennis", "sf", "san-francisco-rec-park"],
    ["pickleball", "mountain-view", "city-of-mountain-view"],
  ])(
    "accepts sport=%s and city=%s",
    async (sport, city, expectedCitySlug) => {
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

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";

describe("GET /api/directions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("limits concurrent Mapbox calls for a maximum-size request", async () => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token");

    let inFlight = 0;
    let peakInFlight = 0;
    const fetchMock = vi.fn(async () => {
      inFlight += 1;
      peakInFlight = Math.max(peakInFlight, inFlight);

      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;

      return new Response(
        JSON.stringify({ routes: [{ duration: 600, distance: 1_000 }] }),
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const locations = Array.from(
      { length: 50 },
      (_, index) => `court-${index}:37.${index},-122.${index}`
    ).join("|");
    const request = new NextRequest(
      `https://example.com/api/directions?locations=${encodeURIComponent(locations)}`
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.travelTimes).toHaveLength(50);
    expect(body.travelTimes.map((item: { locationId: string }) => item.locationId))
      .toEqual(Array.from({ length: 50 }, (_, index) => `court-${index}`));
    expect(fetchMock).toHaveBeenCalledTimes(100);
    expect(peakInFlight).toBeLessThanOrEqual(6);
  });

  it.each([
    "",
    ",",
    "0,",
    ",0",
    "0,0,extra",
    "91,0",
    "-91,0",
    "0,181",
    "0,-181",
    "NaN,0",
  ])("rejects an invalid explicit origin without calling Mapbox: %s", async (origin) => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest(
      `https://example.com/api/directions?origin=${encodeURIComponent(origin)}&locations=court:37.75,-122.45`
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid 'origin' parameter" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "court:",
    "court:,",
    "court:0,",
    "court:,0",
    "court:0,0,extra",
    "court:91,0",
    "court:-91,0",
    "court:0,181",
    "court:0,-181",
    "court:NaN,0",
  ])("rejects an invalid destination without calling Mapbox: %s", async (location) => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest(
      `https://example.com/api/directions?locations=${encodeURIComponent(location)}`
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "No valid locations" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts boundary coordinates and valid negative coordinates", async () => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ routes: [{ duration: 600, distance: 1_000 }] }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const locations = "boundary:-90,-180|negative:37.75,-122.45";
    const request = new NextRequest(
      `https://example.com/api/directions?origin=90,180&locations=${encodeURIComponent(locations)}`
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.travelTimes).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["missing metrics", {}],
    ["a null duration", { duration: null, distance: 1_000 }],
    ["a null distance", { duration: 600, distance: null }],
    ["a string duration", { duration: "600", distance: 1_000 }],
    ["a string distance", { duration: 600, distance: "1000" }],
    ["a non-finite duration", { duration: Number.NaN, distance: 1_000 }],
    ["a non-finite distance", { duration: 600, distance: Number.POSITIVE_INFINITY }],
    ["a negative duration", { duration: -1, distance: 1_000 }],
    ["a negative distance", { duration: 600, distance: -1 }],
  ])("returns no route for %s", async (_description, route) => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token");
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ routes: [route] }),
    })));

    const request = new NextRequest(
      "https://example.com/api/directions?locations=court-1:37.75,-122.45"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.travelTimes[0].walking).toBeNull();
    expect(body.travelTimes[0].driving).toBeNull();
  });

  it("returns rounded route metrics when both values are finite numbers", async () => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "test-token");
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        routes: [{ duration: 629.9, distance: 1_000.6 }],
      }),
    })));

    const request = new NextRequest(
      "https://example.com/api/directions?locations=court-1:37.75,-122.45"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(body.travelTimes[0].walking).toEqual({
      durationMinutes: 10,
      distanceMeters: 1_001,
    });
    expect(body.travelTimes[0].driving).toEqual({
      durationMinutes: 10,
      distanceMeters: 1_001,
    });
  });
});

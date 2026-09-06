import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchAllCourts } from "./recus";

const locationResponse = {
  location: {
    id: "location-1",
    name: "Test courts",
    organizationId: "organization-1",
    timezone: "America/Los_Angeles",
    lat: "37.7749",
    lng: "-122.4194",
    defaultReservationWindow: 7,
    reservationReleaseTimeLocal: "08:00:00",
    courts: [
      {
        id: "court-1",
        locationId: "location-1",
        courtNumber: "1",
        publishedAt: "2026-01-01T00:00:00Z",
        maxReservationTime: "01:30:00",
        defaultReservationWindowDays: 7,
        reservationReleaseTimeLocal: "08:00:00",
        config: {
          pricing: { default: { type: "fixed", cents: 0 } },
          bookingPolicies: [],
        },
        allowedReservationDurations: { minutes: [90] },
        availableSlots: [],
        sports: [],
        isInstantBookable: true,
      },
    ],
  },
  formattedAddress: "San Francisco, CA",
  hoursOfOperation: "",
  images: {},
  accessInfo: "",
  gettingThereInfo: "",
  distance: null,
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("fetchAllCourts date range", () => {
  it.each([
    ["spring forward", "2026-03-08T07:30:00Z", "2026-03-07", "2026-03-14"],
    ["fall back", "2026-11-01T07:30:00Z", "2026-11-01", "2026-11-08"],
  ])(
    "requests seven Los Angeles calendar days across %s",
    async (_transition, now, expectedStart, expectedEnd) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now));

      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(JSON.stringify([locationResponse]), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: {} }), { status: 200 }),
        );

      await fetchAllCourts();

      const availabilityUrl = new URL(String(fetchMock.mock.calls[1][0]));
      expect(availabilityUrl.searchParams.get("startDate")).toBe(expectedStart);
      expect(availabilityUrl.searchParams.get("endDate")).toBe(expectedEnd);
    },
  );
});

import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /openapi.json", () => {
  it("marks guaranteed response fields as required", async () => {
    const response = GET();
    const document = await response.json();
    const schemas = document.components.schemas;
    const travelTime = schemas.DirectionsResponse.properties.travelTimes.items;

    expect(schemas.CourtsResponse.required).toEqual([
      "sport",
      "city",
      "fetchedAt",
      "courts",
    ]);
    expect(schemas.Location.required).toEqual([
      "id",
      "name",
      "lat",
      "lng",
      "address",
      "courts",
      "totalSlotsToday",
      "totalSlotsWeek",
      "availabilityStatus",
    ]);
    expect(schemas.Court.required).toEqual([
      "id",
      "sportId",
      "availableSlots",
    ]);
    expect(schemas.Slot.required).toEqual(["date", "weather"]);
    expect(schemas.Slot.properties.weather.type).toEqual(["object", "null"]);
    expect(schemas.DirectionsResponse.required).toEqual(["travelTimes"]);
    expect(travelTime.required).toEqual([
      "locationId",
      "walking",
      "driving",
      "transitUrl",
    ]);
    expect(schemas.TravelMode.required).toEqual([
      "durationMinutes",
      "distanceMeters",
    ]);
  });
});

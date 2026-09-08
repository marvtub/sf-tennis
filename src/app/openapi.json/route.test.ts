import { compileErrors, validate } from "@readme/openapi-parser";
import { describe, expect, it } from "vitest";

import { GET } from "./route";

function collectLocalReferences(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectLocalReferences);
  }

  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    if (
      key === "$ref" &&
      typeof nestedValue === "string" &&
      nestedValue.startsWith("#/")
    ) {
      return [nestedValue];
    }

    return collectLocalReferences(nestedValue);
  });
}

function resolveLocalReference(document: unknown, reference: string): unknown {
  return reference
    .slice(2)
    .split("/")
    .map((segment) =>
      decodeURIComponent(segment).replaceAll("~1", "/").replaceAll("~0", "~"),
    )
    .reduce<unknown>((value, segment) => {
      if (value === null || typeof value !== "object" || !(segment in value)) {
        return undefined;
      }

      return (value as Record<string, unknown>)[segment];
    }, document);
}

describe("GET /openapi.json", () => {
  it("publishes a valid, resolvable API contract with its cache policy", async () => {
    const response = GET();
    const document = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.oai.openapi+json; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
    expect(document.openapi).toBe("3.1.0");
    expect(document.info).toMatchObject({
      title: "SF Tennis API",
      version: "1.0.0",
    });
    expect(document.servers).toEqual([{ url: "https://tennis.marvinaziz.de" }]);
    expect(document.components.schemas).toEqual(expect.any(Object));
    expect(Object.keys(document.paths).sort()).toEqual([
      "/api/courts",
      "/api/directions",
      "/api/health",
    ]);

    const references = collectLocalReferences(document);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(resolveLocalReference(document, reference), reference).toBeDefined();
    }

    const validation = await validate(document);
    expect(validation.valid, compileErrors(validation)).toBe(true);
  });

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

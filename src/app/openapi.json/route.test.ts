import { describe, expect, it } from "vitest";

import { GET } from "./route";

function collectLocalRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectLocalRefs);
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    if (key === "$ref" && typeof child === "string" && child.startsWith("#/")) {
      return [child];
    }

    return collectLocalRefs(child);
  });
}

function resolveLocalRef(document: unknown, reference: string): unknown {
  return reference
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((value, segment) => {
      if (typeof value !== "object" || value === null) {
        return undefined;
      }

      return (value as Record<string, unknown>)[segment];
    }, document);
}

describe("GET /openapi.json", () => {
  it("serves the published OpenAPI contract", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.oai.openapi+json; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );

    const document = await response.json();

    expect(document).toMatchObject({
      openapi: "3.1.0",
      info: {
        title: "SF Tennis API",
        version: "1.0.0",
      },
      servers: [{ url: "https://tennis.marvinaziz.de" }],
      components: {
        schemas: expect.any(Object),
      },
    });
    expect(Object.keys(document.paths).sort()).toEqual([
      "/api/courts",
      "/api/directions",
      "/api/health",
    ]);

    const localRefs = collectLocalRefs(document);

    expect(localRefs.length).toBeGreaterThan(0);
    for (const reference of localRefs) {
      expect(resolveLocalRef(document, reference), reference).toBeDefined();
    }
  });
});

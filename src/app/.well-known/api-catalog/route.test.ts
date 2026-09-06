import { describe, expect, it } from "vitest";

import { GET, HEAD } from "./route";

describe("API catalog discovery route", () => {
  it("serves the catalog contract", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8',
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
    expect(response.headers.get("Link")).toBe(
      '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
    );
    expect(await response.json()).toEqual({
      linkset: [
        {
          anchor: "https://tennis.marvinaziz.de/api/courts",
          "service-desc": [
            {
              href: "https://tennis.marvinaziz.de/openapi.json",
              type: "application/vnd.oai.openapi+json",
            },
          ],
          "service-doc": [
            {
              href: "https://tennis.marvinaziz.de/docs",
              type: "text/html",
            },
          ],
          status: [
            {
              href: "https://tennis.marvinaziz.de/api/health",
              type: "application/json",
            },
          ],
        },
        {
          anchor: "https://tennis.marvinaziz.de/api/directions",
          "service-desc": [
            {
              href: "https://tennis.marvinaziz.de/openapi.json",
              type: "application/vnd.oai.openapi+json",
            },
          ],
          "service-doc": [
            {
              href: "https://tennis.marvinaziz.de/docs",
              type: "text/html",
            },
          ],
          status: [
            {
              href: "https://tennis.marvinaziz.de/api/health",
              type: "application/json",
            },
          ],
        },
      ],
    });
  });

  it("returns the same headers without a body for metadata-only requests", async () => {
    const getResponse = GET();
    const headResponse = HEAD();

    expect(headResponse.status).toBe(200);
    expect(await headResponse.text()).toBe("");
    expect(Object.fromEntries(headResponse.headers)).toEqual(
      Object.fromEntries(getResponse.headers),
    );
  });
});

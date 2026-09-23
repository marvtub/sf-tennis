import { describe, expect, it } from "vitest";

import { CSP } from "./middleware";

function connectSrc(): string {
  const directive = CSP.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("connect-src "));
  expect(directive).toBeDefined();
  return directive as string;
}

describe("Content-Security-Policy", () => {
  it("allows browsers to fetch live availability and forecasts directly", () => {
    // rec.us blocks server runtimes, so browsers call api.rec.us and
    // api.open-meteo.com themselves. Dropping either host here silently
    // empties every court's slots (and the day picker) with zero errors
    // server-side — only browser console shows the CSP refusal.
    const directive = connectSrc();
    expect(directive).toContain("https://api.rec.us");
    expect(directive).toContain("https://api.open-meteo.com");
  });

  it("keeps the Mapbox hosts the map relies on", () => {
    const directive = connectSrc();
    expect(directive).toContain("https://api.mapbox.com");
    expect(directive).toContain("https://events.mapbox.com");
    expect(directive).toContain("https://*.tiles.mapbox.com");
  });
});

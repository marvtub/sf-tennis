import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

const { apiLimit, pageLimit, discoveryLimit } = vi.hoisted(() => ({
  apiLimit: vi.fn(),
  pageLimit: vi.fn(),
  discoveryLimit: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({
    env: {
      API_RATE_LIMITER: { limit: apiLimit },
      PAGE_RATE_LIMITER: { limit: pageLimit },
      DISCOVERY_RATE_LIMITER: { limit: discoveryLimit },
    },
  }),
}));

beforeEach(() => {
  apiLimit.mockReset().mockResolvedValue({ success: true });
  pageLimit.mockReset().mockResolvedValue({ success: true });
  discoveryLimit.mockReset().mockResolvedValue({ success: true });
});

function requestWithAccept(accept: string): NextRequest {
  return new NextRequest("https://tennis.marvinaziz.de/docs", {
    headers: { accept },
  });
}

describe.each([
  ["home page", "/", "192.0.2.1"],
  ["docs page", "/docs", "192.0.2.2"],
])("Markdown rate limiting for the %s", (_name, pathname, ip) => {
  it("rejects requests denied by the shared page limiter", async () => {
    pageLimit.mockResolvedValueOnce({ success: false });

    const response = await middleware(
      new NextRequest(`https://tennis.marvinaziz.de${pathname}`, {
        headers: {
          Accept: "text/markdown",
          "cf-connecting-ip": ip,
        },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(pageLimit).toHaveBeenCalledWith({ key: ip });
  });
});

describe("middleware API rate limiting", () => {
  it("uses the shared API limiter and rejects a denied request", async () => {
    apiLimit.mockResolvedValueOnce({ success: false });

    const response = await middleware(
      new NextRequest("https://tennis.marvinaziz.de/api/courts", {
        headers: { "cf-connecting-ip": "192.0.2.3" },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(apiLimit).toHaveBeenCalledWith({ key: "192.0.2.3" });
    expect(pageLimit).not.toHaveBeenCalled();
    expect(discoveryLimit).not.toHaveBeenCalled();
  });
});

describe.each([
  ["/llms.txt", "192.0.2.10"],
  ["/openapi.json", "192.0.2.11"],
  ["/.well-known/api-catalog", "192.0.2.12"],
  ["/robots.txt", "192.0.2.13"],
])("middleware discovery rate limiting for %s", (pathname, ip) => {
  it("uses the discovery limiter and rejects a denied request", async () => {
    discoveryLimit.mockResolvedValueOnce({ success: false });

    const response = await middleware(
      new NextRequest(`https://tennis.marvinaziz.de${pathname}`, {
        headers: { "cf-connecting-ip": ip },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("40");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(discoveryLimit).toHaveBeenCalledWith({ key: ip });
    expect(apiLimit).not.toHaveBeenCalled();
    expect(pageLimit).not.toHaveBeenCalled();
  });
});

describe("middleware Markdown negotiation", () => {
  it.each([
    "text/markdown",
    "text/html, text/markdown;q=0.5",
    "TEXT/MARKDOWN;Q=1",
    'text/markdown; profile="summary,compact"',
  ])("serves Markdown for an accepted Markdown media range: %s", async (accept) => {
    const response = await middleware(requestWithAccept(accept));

    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
  });

  it.each([
    "text/markdown;q=0, text/html",
    "application/x-text/markdownish",
    "text/html",
  ])("continues to the page when Markdown is not accepted: %s", async (accept) => {
    const response = await middleware(requestWithAccept(accept));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("Content-Type")).toBeNull();
  });
});

describe("Content-Security-Policy", () => {
  it("allows browsers to fetch live availability and forecasts directly", async () => {
    // rec.us blocks server runtimes, so browsers call api.rec.us and
    // api.open-meteo.com themselves. Dropping either host from connect-src
    // silently empties every court's slots (and the day picker) with zero
    // errors server-side — only the browser console shows the CSP refusal.
    const { CSP } = await import("./middleware");
    const directive = CSP.split(";")
      .map((entry: string) => entry.trim())
      .find((entry: string) => entry.startsWith("connect-src "));
    expect(directive).toBeDefined();
    expect(directive).toContain("https://api.rec.us");
    expect(directive).toContain("https://api.open-meteo.com");
  });

  it("keeps the Mapbox hosts the map relies on", async () => {
    const { CSP } = await import("./middleware");
    const directive = CSP.split(";")
      .map((entry: string) => entry.trim())
      .find((entry: string) => entry.startsWith("connect-src "));
    expect(directive).toBeDefined();
    expect(directive).toContain("https://api.mapbox.com");
    expect(directive).toContain("https://events.mapbox.com");
    expect(directive).toContain("https://*.tiles.mapbox.com");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

const { apiLimit, pageLimit } = vi.hoisted(() => ({
  apiLimit: vi.fn(),
  pageLimit: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({
    env: {
      API_RATE_LIMITER: { limit: apiLimit },
      PAGE_RATE_LIMITER: { limit: pageLimit },
    },
  }),
}));

beforeEach(() => {
  apiLimit.mockReset().mockResolvedValue({ success: true });
  pageLimit.mockReset().mockResolvedValue({ success: true });
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

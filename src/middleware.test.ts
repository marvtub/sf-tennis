import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

function requestWithAccept(accept: string): NextRequest {
  return new NextRequest("https://tennis.marvinaziz.de/docs", {
    headers: { accept },
  });
}

describe.each([
  ["home page", "/", "192.0.2.1"],
  ["docs page", "/docs", "192.0.2.2"],
])("Markdown rate limiting for the %s", (_name, pathname, ip) => {
  it("rejects requests after the page limit is reached", () => {
    const request = () =>
      new NextRequest(`https://tennis.marvinaziz.de${pathname}`, {
        headers: {
          Accept: "text/markdown",
          "cf-connecting-ip": ip,
        },
      });

    for (let count = 0; count < 100; count++) {
      const response = middleware(request());
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/markdown; charset=utf-8",
      );
    }

    const response = middleware(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });
});

describe("middleware Markdown negotiation", () => {
  it.each([
    "text/markdown",
    "text/html, text/markdown;q=0.5",
    "TEXT/MARKDOWN;Q=1",
    'text/markdown; profile="summary,compact"',
  ])("serves Markdown for an accepted Markdown media range: %s", (accept) => {
    const response = middleware(requestWithAccept(accept));

    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
  });

  it.each([
    "text/markdown;q=0, text/html",
    "application/x-text/markdownish",
    "text/html",
  ])("continues to the page when Markdown is not accepted: %s", (accept) => {
    const response = middleware(requestWithAccept(accept));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("Content-Type")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

function requestWithAccept(accept: string): NextRequest {
  return new NextRequest("https://tennis.marvinaziz.de/docs", {
    headers: { accept },
  });
}

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

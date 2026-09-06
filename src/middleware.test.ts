import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

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

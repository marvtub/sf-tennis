import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /robots.txt", () => {
  it("publishes the crawler and sitemap contract", async () => {
    const response = GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
    const groups = body.split(/\n\s*\n/);
    for (const userAgent of [
      "*",
      "GPTBot",
      "ClaudeBot",
      "PerplexityBot",
      "Google-Extended",
    ]) {
      expect(groups).toContain(
        [
          `User-agent: ${userAgent}`,
          "Allow: /",
          "Content-Signal: ai-train=no, search=yes, ai-input=yes",
        ].join("\n"),
      );
    }
    expect(body).toContain(
      "Sitemap: https://tennis.marvinaziz.de/sitemap.xml",
    );
  });
});

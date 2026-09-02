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
    for (const directive of [
      "User-agent: *\nAllow: /",
      "User-agent: GPTBot\nAllow: /",
      "User-agent: ClaudeBot\nAllow: /",
      "User-agent: PerplexityBot\nAllow: /",
      "User-agent: Google-Extended\nAllow: /",
      "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    ]) {
      expect(body).toContain(directive);
    }
    expect(body).toContain(
      "Sitemap: https://tennis.marvinaziz.de/sitemap.xml",
    );
  });
});

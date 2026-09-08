import { describe, expect, it } from "vitest";

import { LAST_UPDATED, SITE_URL } from "../../lib/agent-readiness";
import { GET } from "./route";

const expectedEntries = [
  { path: "/", priority: "1.0" },
  { path: "/docs", priority: "0.9" },
  { path: "/llms.txt", priority: "0.8" },
  { path: "/docs.md", priority: "0.7" },
  { path: "/openapi.json", priority: "0.7" },
  { path: "/.well-known/api-catalog", priority: "0.7" },
  { path: "/.well-known/agent-skills/index.json", priority: "0.6" },
];

describe("GET /sitemap.xml", () => {
  it("publishes each canonical URL with its sitemap metadata", async () => {
    const response = GET();
    const body = await response.text();
    const expectedUrlBlocks = expectedEntries.map(
      ({ path, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${LAST_UPDATED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/xml; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
    expect(body).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${expectedUrlBlocks.join("\n")}
</urlset>
`);
  });
});

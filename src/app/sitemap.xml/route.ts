import { LAST_UPDATED, SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

const paths = [
  { loc: "/", priority: "1.0" },
  { loc: "/docs", priority: "0.9" },
  { loc: "/llms.txt", priority: "0.8" },
  { loc: "/docs.md", priority: "0.7" },
  { loc: "/openapi.json", priority: "0.7" },
  { loc: "/.well-known/api-catalog", priority: "0.7" },
  { loc: "/.well-known/agent-skills/index.json", priority: "0.6" },
];

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    ({ loc, priority }) => `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${LAST_UPDATED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

export function GET() {
  return new Response(SITEMAP, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

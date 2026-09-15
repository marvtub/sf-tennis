import { DISCOVERY_CACHE_CONTROL, SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

const ROBOTS = `User-agent: *
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=yes

User-agent: GPTBot
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=yes

User-agent: ClaudeBot
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=yes

User-agent: PerplexityBot
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=yes

User-agent: Google-Extended
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=yes

Sitemap: ${SITE_URL}/sitemap.xml
`;

export function GET() {
  return new Response(ROBOTS, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": DISCOVERY_CACHE_CONTROL,
    },
  });
}

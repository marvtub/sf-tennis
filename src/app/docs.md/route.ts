import { DISCOVERY_CACHE_CONTROL, DOCS_MARKDOWN } from "@/lib/agent-readiness";

export const dynamic = "force-static";

export function GET() {
  return new Response(DOCS_MARKDOWN, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": DISCOVERY_CACHE_CONTROL,
      Link: '</docs>; rel="canonical"; type="text/html"',
    },
  });
}

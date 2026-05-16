import { LLMS_TXT } from "@/lib/agent-readiness";

export const dynamic = "force-static";

export function GET() {
  return new Response(LLMS_TXT, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      Link: '</llms.txt>; rel="canonical"; type="text/markdown"',
    },
  });
}

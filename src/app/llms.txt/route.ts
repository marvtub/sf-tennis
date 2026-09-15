import { DISCOVERY_CACHE_CONTROL, LLMS_TXT } from "@/lib/agent-readiness";

export const dynamic = "force-static";

export function GET() {
  return new Response(LLMS_TXT, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": DISCOVERY_CACHE_CONTROL,
    },
  });
}

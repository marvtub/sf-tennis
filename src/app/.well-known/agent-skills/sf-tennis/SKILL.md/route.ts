import { DISCOVERY_CACHE_CONTROL, SKILL_MD } from "@/lib/agent-readiness";

export const dynamic = "force-static";

export function GET() {
  return new Response(SKILL_MD, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": DISCOVERY_CACHE_CONTROL,
    },
  });
}

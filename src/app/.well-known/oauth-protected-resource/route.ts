import { SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

const metadata = {
  resource: `${SITE_URL}/api/history/external`,
  authorization_servers: [SITE_URL],
  scopes_supported: ["history:read", "history:write"],
  bearer_methods_supported: ["header"],
  resource_documentation: `${SITE_URL}/docs`,
};

export function GET() {
  return Response.json(metadata, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

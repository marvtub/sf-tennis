import { SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      error: "A2A service unavailable",
      message:
        "SF Tennis does not implement an A2A service. Use its public API discovery documents instead.",
      links: {
        documentation: `${SITE_URL}/docs`,
        openapi: `${SITE_URL}/openapi.json`,
        apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
        skills: `${SITE_URL}/.well-known/agent-skills/index.json`,
      },
    },
    {
      status: 410,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        Link: [
          '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
          '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
          '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
        ].join(", "),
      },
    },
  );
}

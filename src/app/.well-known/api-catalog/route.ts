import { SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

const catalog = {
  linkset: [
    {
      anchor: `${SITE_URL}/api/courts`,
      "service-desc": [
        { href: `${SITE_URL}/openapi.json`, type: "application/vnd.oai.openapi+json" },
      ],
      "service-doc": [{ href: `${SITE_URL}/docs`, type: "text/html" }],
      status: [{ href: `${SITE_URL}/api/health`, type: "application/json" }],
    },
    {
      anchor: `${SITE_URL}/api/directions`,
      "service-desc": [
        { href: `${SITE_URL}/openapi.json`, type: "application/vnd.oai.openapi+json" },
      ],
      "service-doc": [{ href: `${SITE_URL}/docs`, type: "text/html" }],
      status: [{ href: `${SITE_URL}/api/health`, type: "application/json" }],
    },
  ],
};

const headers = {
  "Content-Type":
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8',
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  Link: `</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
};

export function GET() {
  return Response.json(catalog, { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}

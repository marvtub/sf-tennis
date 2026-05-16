import { SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

const metadata = {
  issuer: SITE_URL,
  authorization_endpoint: `${SITE_URL}/oauth/authorize`,
  token_endpoint: `${SITE_URL}/oauth/token`,
  jwks_uri: `${SITE_URL}/.well-known/jwks.json`,
  grant_types_supported: ["client_credentials"],
  response_types_supported: ["code"],
  scopes_supported: ["courts:read", "history:read", "history:write"],
  token_endpoint_auth_methods_supported: [
    "client_secret_basic",
    "client_secret_post",
  ],
  service_documentation: `${SITE_URL}/docs`,
};

export function GET() {
  return Response.json(metadata, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

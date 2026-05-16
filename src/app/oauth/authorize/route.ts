import { SITE_URL } from "@/lib/agent-readiness";

export function GET() {
  return Response.json(
    {
      error: "unsupported_response_type",
      error_description:
        "SF Tennis supports machine access through client_credentials at /oauth/token or direct API-key bearer auth for /api/history/external.",
      documentation: `${SITE_URL}/docs`,
    },
    { status: 400 }
  );
}

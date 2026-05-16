import { NextRequest } from "next/server";

const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

function decodeBasicAuth(header: string | null): {
  clientId: string;
  clientSecret: string;
} | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const colon = decoded.indexOf(":");
    if (colon < 0) return null;
    return {
      clientId: decoded.slice(0, colon),
      clientSecret: decoded.slice(colon + 1),
    };
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const grantType = String(form.get("grant_type") ?? "");
  if (grantType !== "client_credentials") {
    return Response.json({ error: "unsupported_grant_type" }, { status: 400 });
  }

  const basic = decodeBasicAuth(request.headers.get("authorization"));
  const clientSecret = basic?.clientSecret || String(form.get("client_secret") ?? "");
  const apiKey = process.env.API_KEY;

  if (!apiKey || !clientSecret || !timingSafeEqual(clientSecret, apiKey)) {
    return Response.json({ error: "invalid_client" }, { status: 401 });
  }

  return Response.json({
    access_token: apiKey,
    token_type: "Bearer",
    expires_in: TOKEN_TTL_SECONDS,
    scope: "history:read history:write",
  });
}

import { NextRequest, NextResponse } from "next/server";
import {
  DISCOVERY_LINK_HEADER,
  DOCS_MARKDOWN,
  HOME_MARKDOWN,
} from "./lib/agent-readiness";

// Simple in-memory rate limiter (per-IP, resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 req/min for API routes
const EXTERNAL_API_LIMIT = 10; // 10 req/min for external write API
const MAP_LOAD_LIMIT = 100; // 100 page loads per minute (very generous)

// ── Security headers ──
//
// CSP allows 'unsafe-inline' for script/style because Next App Router inlines
// hydration scripts and Mapbox GL inlines styles; tightening that would
// require a nonce pipeline. The other headers are unambiguous wins.
//
// Mapbox connects to api.mapbox.com (tiles + Directions) and events.mapbox.com
// (telemetry). Tile/sprite/glyph assets live under *.tiles.mapbox.com.

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.mapbox.com https://*.tiles.mapbox.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(self), camera=(), microphone=(), payment=(), usb=()"
  );
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return res;
}

function applyDiscoveryHeaders(res: NextResponse): NextResponse {
  res.headers.set("Link", DISCOVERY_LINK_HEADER);
  return res;
}

function acceptsMarkdown(request: NextRequest): boolean {
  return request.headers.get("accept")?.includes("text/markdown") ?? false;
}

function markdownResponse(markdown: string): NextResponse {
  return applySecurityHeaders(
    applyDiscoveryHeaders(
      new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=3600",
        },
      })
    )
  );
}

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isExternalApi = request.nextUrl.pathname.startsWith("/api/history/external");
  const isPage = request.nextUrl.pathname === "/";
  const isDocs = request.nextUrl.pathname === "/docs";
  const limit = isExternalApi ? EXTERNAL_API_LIMIT : isApi ? RATE_LIMIT_MAX_REQUESTS : MAP_LOAD_LIMIT;
  const key = `${ip}:${isExternalApi ? "external" : isApi ? "api" : "page"}`;

  if (acceptsMarkdown(request)) {
    if (isPage) return markdownResponse(HOME_MARKDOWN);
    if (isDocs) return markdownResponse(DOCS_MARKDOWN);
  }

  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count > limit) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Too many requests. Please slow down." },
          {
            status: 429,
            headers: {
              "Retry-After": "60",
              "X-RateLimit-Limit": String(limit),
            },
          }
        )
      );
    }
  }

  // Clean up old entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  const response = applySecurityHeaders(NextResponse.next());
  return isPage || isDocs ? applyDiscoveryHeaders(response) : response;
}

export const config = {
  matcher: ["/", "/docs", "/api/:path*"],
};

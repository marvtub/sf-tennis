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

function splitHeaderValue(value: string, delimiter: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let inQuotes = false;
  let escaped = false;

  for (let index = 0; index < value.length; index++) {
    const character = value[index];

    if (escaped) {
      escaped = false;
    } else if (inQuotes && character === "\\") {
      escaped = true;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && character === delimiter) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts;
}

function acceptsMarkdown(request: NextRequest): boolean {
  const accept = request.headers.get("accept");
  if (!accept) return false;

  return splitHeaderValue(accept, ",").some((mediaRange) => {
    const [type, ...parameters] = splitHeaderValue(mediaRange, ";");
    if (type.trim().toLowerCase() !== "text/markdown") return false;

    const qualityParameter = parameters.find((parameter) => {
      const separator = parameter.indexOf("=");
      return separator !== -1 &&
        parameter.slice(0, separator).trim().toLowerCase() === "q";
    });

    if (!qualityParameter) return true;

    const separator = qualityParameter.indexOf("=");
    const quality = Number(qualityParameter.slice(separator + 1).trim());
    return Number.isFinite(quality) && quality > 0;
  });
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
  const isPage = request.nextUrl.pathname === "/";
  const isDocs = request.nextUrl.pathname === "/docs";
  const limit = isApi ? RATE_LIMIT_MAX_REQUESTS : MAP_LOAD_LIMIT;
  const key = `${ip}:${isApi ? "api" : "page"}`;

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

  if (acceptsMarkdown(request)) {
    if (isPage) return markdownResponse(HOME_MARKDOWN);
    if (isDocs) return markdownResponse(DOCS_MARKDOWN);
  }

  const response = applySecurityHeaders(NextResponse.next());
  return isPage || isDocs ? applyDiscoveryHeaders(response) : response;
}

export const config = {
  matcher: ["/", "/docs", "/api/:path*"],
};

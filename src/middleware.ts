import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (per-IP, resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 req/min for API routes
const MAP_LOAD_LIMIT = 100; // 100 page loads per minute (very generous)

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isPage = request.nextUrl.pathname === "/";
  const limit = isApi ? RATE_LIMIT_MAX_REQUESTS : MAP_LOAD_LIMIT;
  const key = `${ip}:${isApi ? "api" : "page"}`;

  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count > limit) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(limit),
          },
        }
      );
    }
  }

  // Block common bots (don't waste Mapbox loads)
  if (isPage) {
    const ua = request.headers.get("user-agent") ?? "";
    const botPatterns =
      /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|bingpreview|semrush|ahrefs|mj12bot/i;
    if (botPatterns.test(ua)) {
      return new NextResponse("Not available", { status: 403 });
    }
  }

  // Clean up old entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/:path*"],
};

import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticated,
  verifyPin,
  SESSION_COOKIE,
  SESSION_DURATION,
} from "@/lib/auth";

// ── Per-IP login throttle (defense-in-depth against PIN brute force) ──
//
// In-memory and per-isolate, just like src/middleware.ts. Coarse, but
// makes online brute-force impractical for a short PIN. Failed attempts
// are counted; a successful login resets the counter.

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_FAILURES = 5;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function checkLoginAllowed(ip: string): {
  allowed: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) return { allowed: true, retryAfter: 0 };
  if (entry.count >= LOGIN_MAX_FAILURES) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfter: 0 };
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count++;
  }
}

function resetFailures(ip: string): void {
  loginAttempts.delete(ip);
}

/** GET /api/auth — check auth status */
export async function GET() {
  const authed = await isAuthenticated();
  return NextResponse.json({ authenticated: authed });
}

/** POST /api/auth — login with PIN */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const gate = checkLoginAllowed(ip);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  let pin: unknown;
  try {
    const body = (await request.json()) as { pin?: unknown };
    pin = body.pin;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (typeof pin !== "string") {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const sessionValue = await verifyPin(pin);
  if (!sessionValue) {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  resetFailures(ip);

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return response;
}

/** DELETE /api/auth — logout */
export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  // Explicit overwrite with maxAge: 0 is more reliable across UAs than
  // relying on Set-Cookie deletion semantics alone.
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticated,
  verifyPin,
  SESSION_COOKIE,
  SESSION_DURATION,
} from "@/lib/auth";

/** GET /api/auth — check auth status */
export async function GET() {
  const authed = await isAuthenticated();
  return NextResponse.json({ authenticated: authed });
}

/** POST /api/auth — login with PIN */
export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  const sessionValue = verifyPin(pin);
  if (!sessionValue) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

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
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

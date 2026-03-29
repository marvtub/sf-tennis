import { NextResponse } from "next/server";
import { isAuthenticated } from "./auth";

/**
 * Check auth and return 401 response if not authenticated.
 * Returns null if authenticated (proceed with request).
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  return null;
}

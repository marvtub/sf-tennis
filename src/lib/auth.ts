import { cookies } from "next/headers";

const SESSION_COOKIE = "sf-tennis-session";
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Check if the current request is authenticated (has valid session cookie).
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;

  // Session value is just a signed timestamp — check it's not expired
  try {
    const { ts, pin } = JSON.parse(
      Buffer.from(session.value, "base64").toString()
    );
    const age = Date.now() / 1000 - ts;
    return age < SESSION_DURATION && pin === process.env.AUTH_PIN;
  } catch {
    return false;
  }
}

/**
 * Verify PIN and return a session cookie value if correct.
 */
export function verifyPin(pin: string): string | null {
  const correctPin = process.env.AUTH_PIN;
  if (!correctPin || pin !== correctPin) return null;

  const payload = JSON.stringify({ ts: Math.floor(Date.now() / 1000), pin });
  return Buffer.from(payload).toString("base64");
}

export { SESSION_COOKIE, SESSION_DURATION };

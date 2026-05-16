import { cookies } from "next/headers";

const SESSION_COOKIE = "sf-tennis-session";
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// ── Constant-time string compare ──

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── HMAC-signed session token ──
//
// Session format: `${payload}.${sig}` where
//   payload = base64url(JSON.stringify({ ts: <unix-seconds> }))
//   sig     = base64url(HMAC-SHA256(payload, SESSION_SECRET))
//
// The PIN never leaves the server. Cookie possession alone is enough to
// authenticate (which is how cookies work), but cookie exposure no longer
// discloses the PIN, and the cookie cannot be forged without the secret.

function base64urlEncode(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecodeToString(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return atob(b64);
}

async function getSigningKey(): Promise<CryptoKey | null> {
  // Prefer dedicated SESSION_SECRET. Fall back to deriving from AUTH_PIN so
  // existing deployments keep working without a new env var (the derivation
  // is still strictly better than embedding the PIN in the cookie).
  const explicit = process.env.SESSION_SECRET;
  const pin = process.env.AUTH_PIN;
  const secretSource = explicit || (pin ? `pin:${pin}` : null);
  if (!secretSource) return null;

  const enc = new TextEncoder();
  // Hash the source so the imported key has uniform 32-byte length
  // regardless of whether SESSION_SECRET or AUTH_PIN was used.
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secretSource));
  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payload: string): Promise<string> {
  const key = await getSigningKey();
  if (!key) throw new Error("Session secret not configured");
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return base64urlEncode(new Uint8Array(sig));
}

/**
 * Verify the current session cookie. Returns true iff the cookie has a
 * valid signature under SESSION_SECRET (or AUTH_PIN-derived fallback) and
 * has not expired.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;

  const dot = session.value.indexOf(".");
  if (dot <= 0 || dot === session.value.length - 1) return false;

  const payload = session.value.slice(0, dot);
  const providedSig = session.value.slice(dot + 1);

  let expectedSig: string;
  try {
    expectedSig = await signPayload(payload);
  } catch {
    return false;
  }
  if (!timingSafeEqual(providedSig, expectedSig)) return false;

  try {
    const { ts } = JSON.parse(base64urlDecodeToString(payload)) as {
      ts?: number;
    };
    if (typeof ts !== "number") return false;
    const age = Math.floor(Date.now() / 1000) - ts;
    return age >= 0 && age < SESSION_DURATION;
  } catch {
    return false;
  }
}

/**
 * Verify PIN with constant-time compare and, on success, return a signed
 * session cookie value. The returned value contains no secret material.
 */
export async function verifyPin(pin: string): Promise<string | null> {
  const correctPin = process.env.AUTH_PIN;
  if (!correctPin || typeof pin !== "string") return null;
  if (!timingSafeEqual(pin, correctPin)) return null;

  const payloadBytes = new TextEncoder().encode(
    JSON.stringify({ ts: Math.floor(Date.now() / 1000) })
  );
  const payload = base64urlEncode(payloadBytes);
  const sig = await signPayload(payload);
  return `${payload}.${sig}`;
}

export { SESSION_COOKIE, SESSION_DURATION };

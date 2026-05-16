import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getFriends, addFriend, removeFriend } from "@/lib/db";

// Friends carry personal data (home address + coordinates). Treat as
// authenticated-only across all verbs, not just writes.

const MAX_NAME = 100;
const MAX_ADDRESS = 300;
const MAX_EMOJI = 16;

function sanitizeString(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.slice(0, maxLen).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** GET /api/friends — list friends (auth required) */
export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  const friends = await getFriends();
  return NextResponse.json({ friends });
}

/** POST /api/friends — add a friend (auth required) */
export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const name = sanitizeString(body.name, MAX_NAME);
  const address = sanitizeString(body.address, MAX_ADDRESS);
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!name || !address) {
    return NextResponse.json(
      { error: "Missing required fields: name, address" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json(
      { error: "Invalid lat" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: "Invalid lng" },
      { status: 400 }
    );
  }

  const emoji = sanitizeString(body.emoji, MAX_EMOJI) ?? "👤";

  const id = crypto.randomUUID();
  await addFriend({ id, name, address, lat, lng, emoji });

  return NextResponse.json({ ok: true, id });
}

/** DELETE /api/friends — remove a friend (auth required) */
export async function DELETE(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  let body: { id?: unknown };
  try {
    body = (await request.json()) as { id?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const id = sanitizeString(body.id, 100);
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await removeFriend(id);
  return NextResponse.json({ ok: true });
}

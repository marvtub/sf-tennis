import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getFriends, addFriend, removeFriend } from "@/lib/db";

/** GET /api/friends — list friends (public — shown on map) */
export async function GET() {
  const friends = await getFriends();
  return NextResponse.json({ friends });
}

/** POST /api/friends — add a friend (auth required) */
export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const body = await request.json();
  const { name, address, lat, lng, emoji } = body;

  if (!name || !address || lat == null || lng == null) {
    return NextResponse.json(
      { error: "Missing required fields: name, address, lat, lng" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  await addFriend({
    id,
    name,
    address,
    lat: Number(lat),
    lng: Number(lng),
    emoji: emoji || "👤",
  });

  return NextResponse.json({ ok: true, id });
}

/** DELETE /api/friends — remove a friend (auth required) */
export async function DELETE(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await removeFriend(id);
  return NextResponse.json({ ok: true });
}

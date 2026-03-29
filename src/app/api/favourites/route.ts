import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getFavourites, addFavourite, removeFavourite } from "@/lib/db";

/** GET /api/favourites — list favourite location IDs (public) */
export async function GET() {
  const favourites = await getFavourites();
  return NextResponse.json({ favourites });
}

/** POST /api/favourites — add a favourite (auth required) */
export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { locationId } = await request.json();
  if (!locationId) {
    return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
  }

  await addFavourite(locationId);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/favourites — remove a favourite (auth required) */
export async function DELETE(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { locationId } = await request.json();
  if (!locationId) {
    return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
  }

  await removeFavourite(locationId);
  return NextResponse.json({ ok: true });
}

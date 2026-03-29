import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPlayHistory, addPlayHistory, deletePlayHistory } from "@/lib/db";

/** GET /api/history — list play history (auth required) */
export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const history = await getPlayHistory();
  return NextResponse.json({ history });
}

/** POST /api/history — add a play session (auth required) */
export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const body = await request.json();
  const { locationId, locationName, courtNumber, date, time, friends, notes } =
    body;

  if (!locationId || !locationName || !date) {
    return NextResponse.json(
      { error: "Missing required fields: locationId, locationName, date" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  await addPlayHistory({
    id,
    locationId,
    locationName,
    courtNumber: courtNumber || null,
    date,
    time: time || null,
    friends: friends || [],
    notes: notes || "",
  });

  return NextResponse.json({ ok: true, id });
}

/** DELETE /api/history — delete a play session (auth required) */
export async function DELETE(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deletePlayHistory(id);
  return NextResponse.json({ ok: true });
}

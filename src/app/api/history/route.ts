import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getPlayHistory, addPlayHistory, deletePlayHistory } from "@/lib/db";

// Input caps mirror the external (API-key) route so a leaked PIN can't be
// used to store unbounded blobs.
const MAX_ID = 100;
const MAX_NAME = 200;
const MAX_COURT = 20;
const MAX_TIME = 5;
const MAX_NOTES = 1000;
const MAX_FRIENDS = 20;
const MAX_FRIEND_ID = 100;

function asString(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.slice(0, maxLen).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asFriends(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, MAX_FRIENDS)
    .map((v) => v.slice(0, MAX_FRIEND_ID));
}

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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const locationId = asString(body.locationId, MAX_ID);
  const locationName = asString(body.locationName, MAX_NAME);
  const date = asString(body.date, 10);

  if (!locationId || !locationName || !date) {
    return NextResponse.json(
      { error: "Missing required fields: locationId, locationName, date" },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format, expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const courtNumber = asString(body.courtNumber, MAX_COURT);
  const time = asString(body.time, MAX_TIME);
  const friends = asFriends(body.friends);
  const notes = asString(body.notes, MAX_NOTES) ?? "";

  const id = crypto.randomUUID();
  await addPlayHistory({
    id,
    locationId,
    locationName,
    courtNumber: courtNumber ?? null,
    date,
    time: time ?? null,
    friends,
    notes,
  });

  return NextResponse.json({ ok: true, id });
}

/** DELETE /api/history — delete a play session (auth required) */
export async function DELETE(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  let body: { id?: unknown };
  try {
    body = (await request.json()) as { id?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = asString(body.id, MAX_ID);
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deletePlayHistory(id);
  return NextResponse.json({ ok: true });
}

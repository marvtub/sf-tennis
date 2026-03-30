import { NextRequest, NextResponse } from "next/server";
import { addPlayHistory } from "@/lib/db";

/**
 * POST /api/history/external — add a match via API key (for agents/automations)
 *
 * Headers:
 *   Authorization: Bearer <API_KEY>
 *
 * Body (JSON):
 *   { locationId, locationName, courtNumber?, date, time?, friends?, notes? }
 */
export async function POST(request: NextRequest) {
  // Verify API key
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API_KEY not configured on server" },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { locationId, locationName, courtNumber, date, time, friends, notes } =
    body as {
      locationId?: string;
      locationName?: string;
      courtNumber?: string;
      date?: string;
      time?: string;
      friends?: string[];
      notes?: string;
    };

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

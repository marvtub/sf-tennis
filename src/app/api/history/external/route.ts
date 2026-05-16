import { NextRequest, NextResponse } from "next/server";
import {
  addPlayHistory,
  getPlayHistory,
  deletePlayHistory,
  updatePlayHistory,
} from "@/lib/db";

// ── Timing-safe API key verification ──

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  // crypto.subtle.timingSafeEqual isn't available everywhere;
  // manual constant-time compare
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

function verifyApiKey(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API_KEY not configured on server" },
      { status: 500 }
    );
  }

  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || !timingSafeEqual(token, apiKey)) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  return null;
}

// ── Input sanitization ──

const MAX_STRING_LENGTH = 500;

function sanitizeString(val: unknown, maxLen = MAX_STRING_LENGTH): string | undefined {
  if (typeof val !== "string") return undefined;
  return val.slice(0, maxLen).trim();
}

/**
 * GET /api/history/external — list match history and court locations
 *
 * Headers:
 *   Authorization: Bearer <API_KEY>
 *
 * Returns: { history, courtsUrl }
 */
export async function GET(request: NextRequest) {
  const denied = verifyApiKey(request);
  if (denied) return denied;

  const history = await getPlayHistory();

  return NextResponse.json({
    history: history.map((entry) => ({
      id: entry.id,
      locationId: entry.locationId,
      locationName: entry.locationName,
      courtNumber: entry.courtNumber,
      date: entry.date,
      time: entry.time,
      notes: entry.notes,
      createdAt: entry.createdAt,
    })),
    courtsUrl: "/api/courts (public, no auth needed)",
  });
}

/**
 * POST /api/history/external — add a match via API key (for automation clients)
 *
 * Headers:
 *   Authorization: Bearer <API_KEY>
 *
 * Body (JSON):
 *   { locationId, locationName, courtNumber?, date, time?, notes? }
 */
export async function POST(request: NextRequest) {
  const denied = verifyApiKey(request);
  if (denied) return denied;

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

  const locationId = sanitizeString(body.locationId);
  const locationName = sanitizeString(body.locationName);
  const date = sanitizeString(body.date, 10); // "2026-03-30"

  if (!locationId || !locationName || !date) {
    return NextResponse.json(
      { error: "Missing required fields: locationId, locationName, date" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format, expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const courtNumber = sanitizeString(body.courtNumber, 20);
  const time = sanitizeString(body.time, 5); // "18:00"
  const notes = sanitizeString(body.notes, 1000) || "";

  const id = crypto.randomUUID();
  await addPlayHistory({
    id,
    locationId,
    locationName,
    courtNumber: courtNumber || null,
    date,
    time: time || null,
    notes,
  });

  return NextResponse.json({ ok: true, id });
}

/**
 * PUT /api/history/external — update a match (for automation clients)
 *
 * Headers:
 *   Authorization: Bearer <API_KEY>
 *
 * Body (JSON):
 *   { id, ...fieldsToUpdate }
 *   Updatable: locationId, locationName, courtNumber, date, time, notes
 */
export async function PUT(request: NextRequest) {
  const denied = verifyApiKey(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const id = sanitizeString(body.id, 100);
  if (!id) {
    return NextResponse.json(
      { error: "Missing required field: id" },
      { status: 400 }
    );
  }

  // Sanitize updatable fields
  const fields: Record<string, unknown> = {};
  if (body.locationId !== undefined) fields.locationId = sanitizeString(body.locationId);
  if (body.locationName !== undefined) fields.locationName = sanitizeString(body.locationName);
  if (body.courtNumber !== undefined) fields.courtNumber = sanitizeString(body.courtNumber, 20);
  if (body.date !== undefined) {
    const d = sanitizeString(body.date, 10);
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    fields.date = d;
  }
  if (body.time !== undefined) fields.time = sanitizeString(body.time, 5);
  if (body.notes !== undefined) fields.notes = sanitizeString(body.notes, 1000);

  const updated = await updatePlayHistory(id, fields);
  if (!updated) {
    return NextResponse.json(
      { error: "Entry not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/history/external — delete a match (for automation clients)
 *
 * Headers:
 *   Authorization: Bearer <API_KEY>
 *
 * Body (JSON):
 *   { id }
 */
export async function DELETE(request: NextRequest) {
  const denied = verifyApiKey(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const id = sanitizeString(body.id, 100);
  if (!id) {
    return NextResponse.json(
      { error: "Missing required field: id" },
      { status: 400 }
    );
  }

  await deletePlayHistory(id);
  return NextResponse.json({ ok: true });
}

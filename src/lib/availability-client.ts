import { RECUS_API_BASE } from "./constants";
import type { TimeSlot } from "@/types";

/**
 * Browser-side rec.us availability fetching.
 *
 * rec.us edge-filtering blocks the availability endpoints for server
 * runtimes (Cloudflare Workers gets HTTP 403), but serves real browsers
 * (same calls as rec.us's own frontend; CORS `*`). So per-court slots are
 * fetched here, in the browser, and merged into the server-provided
 * metadata. A single court failing (removed court, blip) yields no slots
 * for that court — never a total failure.
 */

const BATCH_SIZE = 15;

interface SiteAvailabilityPayload {
  data?: Record<string, Record<string, unknown>>;
}

/** Fetch live slots for many courts; never throws, per-court graceful. */
export async function fetchCourtsAvailability(
  courtIds: string[],
  startDate: string,
  endDate: string
): Promise<Map<string, TimeSlot[]>> {
  const byCourt = new Map<string, TimeSlot[]>();

  for (let i = 0; i < courtIds.length; i += BATCH_SIZE) {
    const batch = courtIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((courtId) => fetchCourtSlots(courtId, startDate, endDate)));
    for (const { courtId, slots } of results) {
      byCourt.set(courtId, slots);
    }
  }

  return byCourt;
}

async function fetchCourtSlots(
  courtId: string,
  startDate: string,
  endDate: string
): Promise<{ courtId: string; slots: TimeSlot[] }> {
  try {
    const url = `${RECUS_API_BASE}/v1/sites/${courtId}/availability?startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return { courtId, slots: [] };
    const data = (await res.json()) as SiteAvailabilityPayload;
    return { courtId, slots: parseSiteSlots(data) };
  } catch {
    return { courtId, slots: [] };
  }
}

/** data.data is { "2026-09-22": { "13:30:00": { ... } } } → sorted slots. Exported for tests. */
export function parseSiteSlots(data: SiteAvailabilityPayload): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (const [date, times] of Object.entries(data.data || {})) {
    for (const time of Object.keys(times as Record<string, unknown>)) {
      const hhmm = time.slice(0, 5);
      slots.push({ datetime: `${date} ${hhmm}`, date, time: hhmm });
    }
  }
  return slots.sort((a, b) => (a.datetime < b.datetime ? -1 : a.datetime > b.datetime ? 1 : 0));
}

/** 7-day window starting today, in America/Los_Angeles (rec.us's timezone). */
export function availabilityWindow(now = new Date()): { startDate: string; endDate: string } {
  const startDate = toZoneDate(now);
  return { startDate, endDate: addCalendarDays(startDate, 7) };
}

/** Date string in a fixed timezone: "2026-09-22". */
export function toZoneDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

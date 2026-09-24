"use client";

import { useEffect } from "react";

import {
  fetchCourtsAvailability,
  availabilityWindow,
  toZoneDate,
} from "@/lib/availability-client";
import { applyFilter } from "@/lib/filter";
import type {
  AvailabilityFilter,
  Court,
  CourtLocation,
  TimeSlot,
} from "@/types";
import type { CityId, Sport } from "@/lib/constants";

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

type ModelContextApi = {
  provideTools?: (tools: WebMcpTool[]) => unknown;
  clearTools?: () => unknown;
  provideContext?: (context: {
    name: string;
    description: string;
    tools: WebMcpTool[];
  }) => unknown;
  clearContext?: () => unknown;
  registerTool?: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ) => unknown;
  unregisterTool?: (name: string) => unknown;
};

function runRegistrationCleanup(handle: unknown): boolean {
  if (typeof handle === "function") {
    handle();
    return true;
  }

  if (!handle || typeof handle !== "object") return false;

  const registration = handle as {
    unregister?: unknown;
    dispose?: unknown;
  };

  if (typeof registration.unregister === "function") {
    registration.unregister.call(handle);
    return true;
  }

  if (typeof registration.dispose === "function") {
    registration.dispose.call(handle);
    return true;
  }

  return false;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function createRegistrationCleanup(
  handle: unknown,
  fallback: () => unknown,
  label: string,
  onRegistrationFailure?: () => void,
): () => void {
  let cleanupRequested = false;
  let fallbackRan = false;
  let pending = isPromiseLike(handle);
  let settledHandle = pending ? undefined : handle;

  const warn = (action: string, error: unknown) => {
    console.warn(`Unable to ${action} WebMCP ${label}`, error);
  };
  const runFallback = () => {
    if (fallbackRan) return;
    fallbackRan = true;
    try {
      const result = fallback();
      if (isPromiseLike(result)) {
        void Promise.resolve(result).catch((error: unknown) =>
          warn("clean up", error),
        );
      }
    } catch (error) {
      warn("clean up", error);
    }
  };
  const runSettledCleanup = () => {
    try {
      return runRegistrationCleanup(settledHandle);
    } catch (error) {
      warn("clean up", error);
      return false;
    }
  };

  if (pending) {
    void Promise.resolve(handle).then(
      (resolvedHandle) => {
        pending = false;
        settledHandle = resolvedHandle;
        if (cleanupRequested && !runSettledCleanup() && !fallbackRan) {
          runFallback();
        }
      },
      (error: unknown) => {
        pending = false;
        settledHandle = undefined;
        if (!cleanupRequested) {
          warn("register", error);
          onRegistrationFailure?.();
        }
      },
    );
  }

  return () => {
    if (cleanupRequested) return;
    cleanupRequested = true;
    if (!pending && runSettledCleanup()) return;
    runFallback();
  };
}

function asChoice(value: unknown, fallback: string, allowed: string[]): string {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function fetchJson(input: string): Promise<unknown> {
  const res = await fetch(input);
  if (!res.ok) throw new Error(`SF Tennis API returned ${res.status}`);
  return res.json();
}

type TrimmedSlot = Pick<TimeSlot, "datetime" | "date" | "time">;

interface TrimmedCourt {
  id: string;
  courtNumber: string;
  priceCentsPerHour: number;
  bookingUrl: string;
  availableSlots: TrimmedSlot[];
}

interface TrimmedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  courts: TrimmedCourt[];
  totalSlotsToday: number;
  totalSlotsWeek: number;
  availabilityStatus: CourtLocation["availabilityStatus"];
}

function trimCourt(court: Court): TrimmedCourt {
  return {
    id: court.id,
    courtNumber: court.courtNumber,
    priceCentsPerHour: court.priceCentsPerHour,
    bookingUrl: court.bookingUrl,
    availableSlots: court.availableSlots.map(({ datetime, date, time }) => ({
      datetime,
      date,
      time,
    })),
  };
}

function trimLocation(loc: CourtLocation): TrimmedLocation {
  return {
    id: loc.id,
    name: loc.name,
    address: loc.address,
    lat: loc.lat,
    lng: loc.lng,
    courts: loc.courts.map(trimCourt),
    totalSlotsToday: loc.totalSlotsToday,
    totalSlotsWeek: loc.totalSlotsWeek,
    availabilityStatus: loc.availabilityStatus,
  };
}

/**
 * Live openings computed in the page, where rec.us is reachable.
 * Mirrors the useCourts pipeline (metadata → per-court availability →
 * filter) minus weather, which agents don't need and which would bloat
 * tool output.
 */
async function executeFindSlots(input: Record<string, unknown>): Promise<string> {
  const sport = asChoice(input.sport, "tennis", ["tennis", "pickleball"]) as Sport;
  const city = asChoice(input.city, "sf", ["sf", "mountain-view"]) as CityId;
  const filter: AvailabilityFilter = {
    date: asOptionalString(input.date),
    weekendOnly: input.weekendOnly === true,
    timeFrom: asOptionalString(input.timeFrom),
    timeTo: asOptionalString(input.timeTo),
  };

  const metaRes = await fetch(`/api/courts?sport=${sport}&city=${city}`);
  if (!metaRes.ok) throw new Error(`SF Tennis API returned ${metaRes.status}`);
  const meta = (await metaRes.json()) as { courts: CourtLocation[]; fetchedAt: string };

  const { startDate, endDate } = availabilityWindow();
  const courtIds = meta.courts.flatMap((loc) => loc.courts.map((c) => c.id));
  const slotsByCourt = await fetchCourtsAvailability(courtIds, startDate, endDate);

  const todayStr = toZoneDate(new Date());
  const withSlots: CourtLocation[] = meta.courts.map((loc) => {
    const courts = loc.courts.map((court) => ({
      ...court,
      availableSlots: slotsByCourt.get(court.id) ?? [],
    }));
    const totalSlotsToday = courts.reduce(
      (sum, c) => sum + c.availableSlots.filter((s) => s.date === todayStr).length,
      0,
    );
    const totalSlotsWeek = courts.reduce((sum, c) => sum + c.availableSlots.length, 0);
    return {
      ...loc,
      courts,
      totalSlotsToday,
      totalSlotsWeek,
      availabilityStatus:
        totalSlotsToday > 0
          ? ("available" as const)
          : totalSlotsWeek > 0
            ? ("later" as const)
            : ("full" as const),
    };
  });

  const filtered = applyFilter(withSlots, filter);
  return JSON.stringify({ locations: filtered.map(trimLocation), fetchedAt: meta.fetchedAt });
}

async function executeDirections(input: Record<string, unknown>): Promise<string> {
  const destinations = Array.isArray(input.destinations) ? input.destinations : [];
  const entries = destinations.slice(0, 50).flatMap((d) => {
    if (!d || typeof d !== "object") return [];
    const { id, lat, lng } = d as { id?: unknown; lat?: unknown; lng?: unknown };
    if (typeof id !== "string" || typeof lat !== "number" || typeof lng !== "number") return [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [`${id}:${lat},${lng}`];
  });
  if (entries.length === 0) {
    throw new Error("Provide at least one destination {id, lat, lng}");
  }
  const params = new URLSearchParams({ locations: entries.join("|") });
  const origin = asOptionalString(input.origin);
  if (origin) params.set("origin", origin);
  return JSON.stringify(await fetchJson(`/api/directions?${params}`));
}

function buildTools(): WebMcpTool[] {
  return [
    {
      name: "sf_tennis_get_courts",
      description:
        "Court metadata for SF Tennis: locations, courts, pricing, booking links. " +
        "availableSlots is always empty and totals are zero server-side (slotsPending:true) " +
        "because rec.us blocks server runtimes. Use sf_tennis_find_slots for live openings.",
      inputSchema: {
        type: "object",
        properties: {
          sport: { type: "string", enum: ["tennis", "pickleball"] },
          city: { type: "string", enum: ["sf", "mountain-view"] },
        },
      },
      execute: async (input) => {
        const sport = asChoice(input.sport, "tennis", ["tennis", "pickleball"]);
        const city = asChoice(input.city, "sf", ["sf", "mountain-view"]);
        return JSON.stringify(await fetchJson(`/api/courts?sport=${sport}&city=${city}`));
      },
    },
    {
      name: "sf_tennis_find_slots",
      description:
        "Live bookable court openings from SF Tennis, computed in the page where rec.us is reachable. " +
        "Same pipeline as the site UI: metadata plus per-court rec.us availability, filtered to your query. " +
        "Prefer passing a specific date; week-wide queries return large payloads. Times are America/Los_Angeles.",
      inputSchema: {
        type: "object",
        properties: {
          sport: {
            type: "string",
            enum: ["tennis", "pickleball"],
            description: "Defaults to tennis.",
          },
          city: {
            type: "string",
            enum: ["sf", "mountain-view"],
            description: "Defaults to sf.",
          },
          date: {
            type: "string",
            description: 'Single day as "YYYY-MM-DD". Omit for the whole week (large).',
          },
          weekendOnly: { type: "boolean" },
          timeFrom: { type: "string", description: 'Earliest start as "HH:MM".' },
          timeTo: { type: "string", description: 'Latest start as "HH:MM".' },
        },
      },
      execute: executeFindSlots,
    },
    {
      name: "sf_tennis_get_directions",
      description:
        "Walking and driving estimates from an origin to court locations via the SF Tennis Mapbox proxy, " +
        "plus a Google Maps transit link per location. Pass origin explicitly as 'lat,lng'; omit it for the " +
        "San Francisco default. Never use the visitor's geolocation without asking. Max 50 destinations.",
      inputSchema: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin as 'lat,lng'." },
          destinations: {
            type: "array",
            maxItems: 50,
            items: {
              type: "object",
              required: ["id", "lat", "lng"],
              properties: {
                id: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
          },
        },
        required: ["destinations"],
      },
      execute: executeDirections,
    },
    {
      name: "sf_tennis_get_docs",
      description: "Fetch the SF Tennis llms.txt guide for API usage instructions.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const res = await fetch("/llms.txt");
        if (!res.ok) throw new Error(`SF Tennis docs returned ${res.status}`);
        return res.text();
      },
    },
  ];
}

function resolveModelContext(): ModelContextApi | undefined {
  if (typeof document !== "undefined") {
    const fromDocument = (
      document as Document & { modelContext?: ModelContextApi }
    ).modelContext;
    if (fromDocument) return fromDocument;
  }
  return (navigator as Navigator & { modelContext?: ModelContextApi }).modelContext;
}

export function WebMcpBridge() {
  useEffect(() => {
    const modelContext = resolveModelContext();

    if (!modelContext) return;

    const tools = buildTools();

    if (typeof modelContext.provideTools === "function") {
      const registration = modelContext.provideTools(tools);
      return createRegistrationCleanup(
        registration,
        () => {
          if (typeof modelContext.clearTools === "function") {
            return modelContext.clearTools();
          }
          return modelContext.provideTools?.([]);
        },
        "tools",
      );
    }

    if (typeof modelContext.provideContext === "function") {
      const context = {
        name: "SF Tennis",
        description:
          "Live public tennis and pickleball availability with API docs.",
        tools,
      };
      const registration = modelContext.provideContext(context);
      return createRegistrationCleanup(
        registration,
        () => {
          if (typeof modelContext.clearContext === "function") {
            return modelContext.clearContext();
          }
          return modelContext.provideContext?.({ ...context, tools: [] });
        },
        "context",
      );
    }

    if (typeof modelContext.registerTool === "function") {
      const cleanups: Array<() => void> = [];
      let cleanupRequested = false;
      const cleanupRegistrations = () => {
        if (cleanupRequested) return;
        cleanupRequested = true;
        [...cleanups].reverse().forEach((cleanup) => cleanup());
      };

      try {
        for (const tool of tools) {
          const controller = new AbortController();
          const handle = modelContext.registerTool(tool, {
            signal: controller.signal,
          });
          cleanups.push(
            createRegistrationCleanup(
              handle,
              () => {
                if (typeof modelContext.unregisterTool === "function") {
                  return modelContext.unregisterTool(tool.name);
                }
                controller.abort();
              },
              `tool "${tool.name}"`,
              cleanupRegistrations,
            ),
          );
        }
      } catch (error) {
        console.warn("Unable to register WebMCP tools", error);
        cleanupRegistrations();
        return;
      }

      return cleanupRegistrations;
    }
  }, []);

  return null;
}

// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WebMcpBridge } from "./WebMcpBridge";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "modelContext");
  vi.restoreAllMocks();
});

describe("WebMcpBridge", () => {
  it("removes registered tools on unmount before registering them again", () => {
    const activeTools = new Set<string>();
    const registerTool = vi.fn((tool: { name: string }) => {
      activeTools.add(tool.name);
    });
    const unregisterTool = vi.fn((name: string) => {
      activeTools.delete(name);
    });

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool, unregisterTool },
    });

    const firstMount = render(<WebMcpBridge />);
    expect(activeTools).toEqual(
      new Set([
        "sf_tennis_get_courts",
        "sf_tennis_find_slots",
        "sf_tennis_get_directions",
        "sf_tennis_get_docs",
      ]),
    );

    firstMount.unmount();
    expect(unregisterTool).toHaveBeenCalledTimes(4);
    expect(activeTools.size).toBe(0);

    render(<WebMcpBridge />);
    expect(registerTool).toHaveBeenCalledTimes(8);
    expect(activeTools).toEqual(
      new Set([
        "sf_tennis_get_courts",
        "sf_tennis_find_slots",
        "sf_tennis_get_directions",
        "sf_tennis_get_docs",
      ]),
    );
  });

  it("aborts signal-based registrations on unmount", () => {
    const activeTools = new Set<string>();
    const registerTool = vi.fn(
      (tool: { name: string }, options?: { signal?: AbortSignal }) => {
        activeTools.add(tool.name);
        options?.signal?.addEventListener("abort", () => {
          activeTools.delete(tool.name);
        });
      },
    );

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool },
    });

    const mounted = render(<WebMcpBridge />);
    expect(activeTools.size).toBe(4);

    mounted.unmount();
    expect(activeTools.size).toBe(0);
  });

  it("invokes promise-resolved cleanup handles after unmount", async () => {
    const activeTools = new Set<string>();
    const resolveHandles: Array<() => void> = [];
    const registerTool = vi.fn((tool: { name: string }) => {
      activeTools.add(tool.name);
      return new Promise<() => void>((resolve) => {
        resolveHandles.push(() => resolve(() => activeTools.delete(tool.name)));
      });
    });

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool },
    });

    const mounted = render(<WebMcpBridge />);
    mounted.unmount();
    expect(activeTools.size).toBe(4);

    await act(async () => {
      resolveHandles.forEach((resolve) => resolve());
    });

    expect(activeTools.size).toBe(0);
  });

  it("rolls back earlier tools when a later registration throws", () => {
    const activeTools = new Set<string>();
    const registerTool = vi.fn((tool: { name: string }) => {
      if (tool.name === "sf_tennis_get_docs") {
        throw new Error("registration failed");
      }
      activeTools.add(tool.name);
    });
    const unregisterTool = vi.fn((name: string) => activeTools.delete(name));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool, unregisterTool },
    });

    render(<WebMcpBridge />);

    expect(registerTool).toHaveBeenCalledTimes(4);
    expect(unregisterTool).toHaveBeenCalledTimes(3);
    expect(unregisterTool).toHaveBeenCalledWith("sf_tennis_get_courts");
    expect(activeTools.size).toBe(0);
  });

  it("rolls back all tools when an asynchronous registration fails", async () => {
    const activeTools = new Set<string>();
    let rejectRegistration!: (error: Error) => void;
    const registerTool = vi.fn((tool: { name: string }) => {
      activeTools.add(tool.name);
      if (tool.name === "sf_tennis_get_docs") {
        return new Promise<void>((_resolve, reject) => {
          rejectRegistration = reject;
        });
      }
    });
    const unregisterTool = vi.fn((name: string) => activeTools.delete(name));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool, unregisterTool },
    });

    render(<WebMcpBridge />);
    await act(async () => {
      rejectRegistration(new Error("registration failed"));
    });

    expect(unregisterTool).toHaveBeenCalledTimes(4);
    expect(activeTools.size).toBe(0);
  });

  it("invokes the cleanup returned by bulk tool registration", () => {
    const dispose = vi.fn();
    const provideTools = vi.fn(() => dispose);

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { provideTools },
    });

    const mounted = render(<WebMcpBridge />);
    mounted.unmount();

    expect(provideTools).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("clears provided context on unmount when no cleanup is returned", () => {
    const provideContext = vi.fn();

    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { provideContext },
    });

    const mounted = render(<WebMcpBridge />);
    mounted.unmount();

    expect(provideContext).toHaveBeenCalledTimes(2);
    expect(provideContext.mock.calls[1]?.[0]).toMatchObject({ tools: [] });
  });

  it("prefers document.modelContext over the deprecated navigator surface", () => {
    const docRegister = vi.fn();
    const navRegister = vi.fn();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: docRegister },
    });
    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool: navRegister },
    });

    try {
      const mounted = render(<WebMcpBridge />);
      expect(docRegister).toHaveBeenCalledTimes(4);
      expect(navRegister).not.toHaveBeenCalled();
      mounted.unmount();
    } finally {
      Reflect.deleteProperty(document, "modelContext");
    }
  });

  it("renders nothing when no modelContext surface exists", () => {
    Reflect.deleteProperty(navigator, "modelContext");
    const { container } = render(<WebMcpBridge />);
    expect(container.firstChild).toBeNull();
  });

  it("describes get_courts as metadata-only with slots pending", () => {
    const tools: Array<{ name: string; description: string }> = [];
    const registerTool = vi.fn((tool: { name: string; description: string }) => {
      tools.push(tool);
    });
    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool },
    });

    render(<WebMcpBridge />);

    const courts = tools.find((t) => t.name === "sf_tennis_get_courts");
    expect(courts?.description).toMatch(/metadata/i);
    expect(courts?.description).toMatch(/slotsPending/);
  });
});

describe("WebMcpBridge tool execution", () => {
  const metadata = {
    courts: [
      {
        id: "loc-1",
        name: "Test Location",
        lat: 37.77,
        lng: -122.42,
        address: "1 Test St",
        courts: [
          {
            id: "court-1",
            courtNumber: "Court 1",
            sportId: "sport-tennis",
            priceCentsPerHour: 500,
            bookingUrl: "https://example.com/court-1",
            availableSlots: [],
          },
        ],
        availabilityStatus: "full",
        totalSlotsToday: 0,
        totalSlotsWeek: 0,
      },
    ],
    fetchedAt: "2026-09-23T12:00:00.000Z",
  };

  const sitePayload = {
    data: {
      "2026-09-23": { "10:30:00": {} },
      "2026-09-24": { "12:00:00": {} },
    },
  };

  function stubFetch() {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.startsWith("/api/directions")) {
          return { ok: true, json: async () => ({ travelTimes: [] }) };
        }
        if (url.startsWith("/api/courts")) {
          return { ok: true, json: async () => metadata };
        }
        if (url.startsWith("https://api.rec.us")) {
          return { ok: true, json: async () => sitePayload };
        }
        throw new Error(`unexpected fetch: ${url}`);
      }),
    );
  }

  function registeredTools(): Array<{
    name: string;
    execute: (input: Record<string, unknown>) => Promise<unknown>;
  }> {
    const tools: Array<{
      name: string;
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: {
        registerTool: vi.fn((tool: {
          name: string;
          execute: (input: Record<string, unknown>) => Promise<unknown>;
        }) => {
          tools.push(tool);
        }),
      },
    });
    render(<WebMcpBridge />);
    return tools;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("find_slots returns trimmed live slots filtered to the requested date", async () => {
    stubFetch();
    const tools = registeredTools();
    const find = tools.find((t) => t.name === "sf_tennis_find_slots");
    expect(find).toBeDefined();

    const raw = (await find?.execute({
      sport: "tennis",
      city: "sf",
      date: "2026-09-23",
    })) as string;
    const body = JSON.parse(raw);

    expect(body.fetchedAt).toBe("2026-09-23T12:00:00.000Z");
    expect(body.locations).toHaveLength(1);
    expect(body.locations[0].totalSlotsWeek).toBe(1);
    const slots = body.locations[0].courts[0].availableSlots;
    expect(slots).toEqual([
      { datetime: "2026-09-23 10:30", date: "2026-09-23", time: "10:30" },
    ]);
    // Trimmed for agent context budgets: no weather, no metadata fluff.
    expect(body.locations[0].courts[0]).not.toHaveProperty("allowedDurations");
    expect(slots[0]).not.toHaveProperty("weather");
  });

  it("get_directions builds the proxy URL from structured destinations", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ travelTimes: [{ locationId: "a" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const tools = registeredTools();
    const directions = tools.find((t) => t.name === "sf_tennis_get_directions");

    const raw = (await directions?.execute({
      origin: "37.77,-122.42",
      destinations: [{ id: "a", lat: 37.78, lng: -122.43 }],
    })) as string;

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/directions?locations=a%3A37.78%2C-122.43&origin=37.77%2C-122.42",
    );
    expect(JSON.parse(raw)).toEqual({ travelTimes: [{ locationId: "a" }] });
  });
});

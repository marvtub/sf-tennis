"use client";

import { useEffect } from "react";

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

function asChoice(value: unknown, fallback: string, allowed: string[]): string {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

export function WebMcpBridge() {
  useEffect(() => {
    const modelContext = (navigator as Navigator & {
      modelContext?: ModelContextApi;
    }).modelContext;

    if (!modelContext) return;

    const tools: WebMcpTool[] = [
      {
        name: "sf_tennis_get_courts",
        description:
          "Get live public tennis or pickleball court availability from SF Tennis.",
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
          const res = await fetch(`/api/courts?sport=${sport}&city=${city}`);
          if (!res.ok) throw new Error(`SF Tennis API returned ${res.status}`);
          return res.json();
        },
      },
      {
        name: "sf_tennis_get_docs",
        description:
          "Fetch the SF Tennis llms.txt guide for API usage instructions.",
        inputSchema: { type: "object", properties: {} },
        execute: async () => {
          const res = await fetch("/llms.txt");
          if (!res.ok) throw new Error(`SF Tennis docs returned ${res.status}`);
          return { markdown: await res.text() };
        },
      },
    ];

    if (typeof modelContext.provideTools === "function") {
      const registration = modelContext.provideTools(tools);
      return () => {
        if (runRegistrationCleanup(registration)) return;
        if (typeof modelContext.clearTools === "function") {
          modelContext.clearTools();
          return;
        }
        modelContext.provideTools?.([]);
      };
    }

    if (typeof modelContext.provideContext === "function") {
      const context = {
        name: "SF Tennis",
        description:
          "Live public tennis and pickleball availability with API docs.",
        tools,
      };
      const registration = modelContext.provideContext(context);
      return () => {
        if (runRegistrationCleanup(registration)) return;
        if (typeof modelContext.clearContext === "function") {
          modelContext.clearContext();
          return;
        }
        modelContext.provideContext?.({ ...context, tools: [] });
      };
    }

    if (typeof modelContext.registerTool === "function") {
      const registrations = tools.map((tool) => {
        const controller = new AbortController();
        const handle = modelContext.registerTool?.(tool, {
          signal: controller.signal,
        });
        void Promise.resolve(handle).catch((error: unknown) => {
          if (!controller.signal.aborted) {
            console.warn(`Unable to register WebMCP tool "${tool.name}"`, error);
          }
        });

        return {
          controller,
          handle,
          tool,
        };
      });

      return () => {
        registrations.forEach(({ controller, handle, tool }) => {
          if (runRegistrationCleanup(handle)) return;
          if (typeof modelContext.unregisterTool === "function") {
            modelContext.unregisterTool(tool.name);
            return;
          }
          controller.abort();
        });
      };
    }
  }, []);

  return null;
}

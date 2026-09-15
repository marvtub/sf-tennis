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

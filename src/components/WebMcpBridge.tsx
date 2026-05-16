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
  provideContext?: (context: {
    name: string;
    description: string;
    tools: WebMcpTool[];
  }) => unknown;
  registerTool?: (tool: WebMcpTool) => unknown;
};

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
      modelContext.provideTools(tools);
      return;
    }

    if (typeof modelContext.provideContext === "function") {
      modelContext.provideContext({
        name: "SF Tennis",
        description:
          "Live public tennis and pickleball availability with API docs.",
        tools,
      });
      return;
    }

    if (typeof modelContext.registerTool === "function") {
      tools.forEach((tool) => modelContext.registerTool?.(tool));
    }
  }, []);

  return null;
}

import { describe, expect, it } from "vitest";

import { GET as getLegacyAgentCard } from "./route";
import { GET as getLegacyAgentCardAlias } from "../agent-card.json/route";
import { DISCOVERY_LINK_HEADER, LLMS_TXT } from "../../../lib/agent-readiness";

describe("legacy agent-card routes", () => {
  it.each([
    ["/.well-known/agent.json", getLegacyAgentCard],
    ["/.well-known/agent-card.json", getLegacyAgentCardAlias],
  ])(
    "retires %s instead of advertising the docs as an A2A endpoint",
    async (_, get) => {
      const response = get();
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body).toEqual({
        error: "A2A service unavailable",
        message:
          "SF Tennis does not implement an A2A service. Use its public API discovery documents instead.",
        links: {
          documentation: "https://tennis.marvinaziz.de/docs",
          openapi: "https://tennis.marvinaziz.de/openapi.json",
          apiCatalog: "https://tennis.marvinaziz.de/.well-known/api-catalog",
          skills:
            "https://tennis.marvinaziz.de/.well-known/agent-skills/index.json",
        },
      });
      expect(body).not.toHaveProperty("protocolVersion");
      expect(body).not.toHaveProperty("url");
    },
  );

  it("does not advertise an agent card through supported discovery surfaces", () => {
    expect(DISCOVERY_LINK_HEADER).not.toContain('rel="agent-card"');
    expect(LLMS_TXT).not.toContain("/.well-known/agent.json");
  });
});

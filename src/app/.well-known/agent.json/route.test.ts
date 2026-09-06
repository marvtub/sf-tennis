import { describe, expect, it } from "vitest";

import { GET as getAgentCardAlias } from "../agent-card.json/route";
import { GET as getAgentCard } from "./route";

const CACHE_POLICY = "public, max-age=3600, s-maxage=86400";
const SKILL_INDEX_LINK =
  '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"';

describe("agent card discovery routes", () => {
  it.each([
    ["/.well-known/agent.json", getAgentCard],
    ["/.well-known/agent-card.json", getAgentCardAlias],
  ])("serves the agent card contract at %s", async (_path, get) => {
    const response = get();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(CACHE_POLICY);
    expect(response.headers.get("Link")).toBe(SKILL_INDEX_LINK);
    expect(await response.json()).toEqual({
      protocolVersion: "0.2.6",
      name: "SF Tennis Agent Guide",
      description:
        "Discovery card for agents that help users find public tennis and pickleball courts with SF Tennis.",
      url: "https://tennis.marvinaziz.de/docs",
      provider: {
        organization: "Marvin Aziz",
        url: "https://marvinaziz.de",
      },
      version: "1.0.0",
      documentationUrl: "https://tennis.marvinaziz.de/docs",
      defaultInputModes: ["text/plain", "application/json"],
      defaultOutputModes: ["text/plain", "application/json"],
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: false,
      },
      skills: [
        {
          id: "find-courts",
          name: "Find public court availability",
          description:
            "Use the public courts API to find available tennis or pickleball slots in San Francisco or Mountain View.",
          tags: [
            "tennis",
            "pickleball",
            "availability",
            "san-francisco",
            "mountain-view",
          ],
          examples: [
            "Find open tennis courts in San Francisco tonight.",
            "Plan a pickleball session in Mountain View this weekend.",
          ],
        },
      ],
    });
  });

  it("keeps the compatibility alias identical to the canonical card", async () => {
    const [canonical, alias] = await Promise.all([
      getAgentCard(),
      getAgentCardAlias(),
    ]);

    expect(await alias.text()).toBe(await canonical.text());
    expect(Object.fromEntries(alias.headers)).toEqual(
      Object.fromEntries(canonical.headers),
    );
  });
});

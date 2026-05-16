import { SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

const agentCard = {
  protocolVersion: "0.2.6",
  name: "SF Tennis Agent Guide",
  description:
    "Discovery card for agents that help users find public tennis and pickleball courts with SF Tennis.",
  url: `${SITE_URL}/docs`,
  provider: {
    organization: "Marvin Aziz",
    url: "https://marvinaziz.de",
  },
  version: "1.0.0",
  documentationUrl: `${SITE_URL}/docs`,
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
      tags: ["tennis", "pickleball", "availability", "san-francisco", "mountain-view"],
      examples: [
        "Find open tennis courts in San Francisco tonight.",
        "Plan a pickleball session in Mountain View this weekend.",
      ],
    },
  ],
};

export function GET() {
  return Response.json(agentCard, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      Link: '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
    },
  });
}

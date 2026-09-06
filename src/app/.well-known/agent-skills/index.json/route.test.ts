import { describe, expect, it } from "vitest";

import { GET as getSkillMarkdown } from "../sf-tennis/SKILL.md/route";
import { GET as getSkillIndex } from "./route";

const CACHE_POLICY = "public, max-age=3600, s-maxage=86400";

async function sha256Digest(content: string) {
  const bytes = new TextEncoder().encode(content);
  const hash = await crypto.subtle.digest("SHA-256", bytes);

  return `sha256:${Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

describe("agent skill discovery routes", () => {
  it("publishes an index whose digest matches the served skill", async () => {
    const [indexResponse, skillResponse] = await Promise.all([
      getSkillIndex(),
      getSkillMarkdown(),
    ]);
    const index = await indexResponse.json();
    const skillMarkdown = await skillResponse.text();

    expect(indexResponse.status).toBe(200);
    expect(indexResponse.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(indexResponse.headers.get("Cache-Control")).toBe(CACHE_POLICY);
    expect(indexResponse.headers.get("Link")).toBe(
      '<https://tennis.marvinaziz.de/.well-known/agent-skills/sf-tennis/SKILL.md>; rel="item"; type="text/markdown"',
    );
    expect(index).toEqual({
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: [
        {
          name: "sf-tennis",
          type: "skill-md",
          description:
            "Use SF Tennis to find public tennis or pickleball court availability and plan sessions.",
          url: "/.well-known/agent-skills/sf-tennis/SKILL.md",
          digest: await sha256Digest(skillMarkdown),
        },
      ],
    });

    expect(skillResponse.status).toBe(200);
    expect(skillResponse.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(skillResponse.headers.get("Cache-Control")).toBe(CACHE_POLICY);
    expect(skillMarkdown).toContain("---\nname: sf-tennis\n");
    expect(skillMarkdown).toContain("# SF Tennis");
    expect(skillMarkdown).toContain("## Public availability workflow");
  });
});

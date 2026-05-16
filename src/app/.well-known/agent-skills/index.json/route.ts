import { sha256Digest, SITE_URL, SKILL_MD } from "@/lib/agent-readiness";

export const dynamic = "force-static";

export async function GET() {
  const index = {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "sf-tennis",
        type: "skill-md",
        description:
          "Use SF Tennis to find public tennis or pickleball court availability and plan sessions.",
        url: "/.well-known/agent-skills/sf-tennis/SKILL.md",
        digest: await sha256Digest(SKILL_MD),
      },
    ],
  };

  return Response.json(index, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      Link: `<${SITE_URL}/.well-known/agent-skills/sf-tennis/SKILL.md>; rel="item"; type="text/markdown"`,
    },
  });
}

export const SITE_URL = "https://tennis.marvinaziz.de";
export const GITHUB_URL = "https://github.com/marvtub/sf-tennis";
export const MARVIN_URL = "https://marvinaziz.de";
export const PROJECT_URL = "https://marvinaziz.de/projects#sf-tennis-court-finder";
export const GITHUB_PROFILE_URL = "https://github.com/marvtub";
export const X_URL = "https://x.com/marvinaziz";
export const LINKEDIN_URL = "https://linkedin.com/in/marvin-aziz";
export const LAST_UPDATED = "2026-05-16";

export const DISCOVERY_LINK_HEADER = [
  '</llms.txt>; rel="alternate"; type="text/markdown"; title="llms.txt"',
  '</docs>; rel="help"; type="text/html"; title="SF Tennis docs"',
  '</docs.md>; rel="alternate"; type="text/markdown"; title="SF Tennis docs"',
  '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
  '</.well-known/agent.json>; rel="agent-card"; type="application/json"',
].join(", ");

export const HOME_MARKDOWN = `# SF Tennis

Real-time availability map and API for public tennis and pickleball courts in San Francisco and Mountain View.

Canonical site: ${SITE_URL}
Documentation: ${SITE_URL}/docs
Repository: ${GITHUB_URL}

## What this app does

- Shows live court availability from rec.us using per-court availability checks.
- Supports tennis and pickleball in San Francisco and Mountain View.
- Adds travel-time overlays from a user's location through Mapbox Directions.
- Exposes public courts, directions, and health APIs for planning workflows.

## Developer entry points

- Integration guide: ${SITE_URL}/llms.txt
- Markdown docs: ${SITE_URL}/docs.md
- OpenAPI contract: ${SITE_URL}/openapi.json
- API catalog: ${SITE_URL}/.well-known/api-catalog
- Skill discovery: ${SITE_URL}/.well-known/agent-skills/index.json

## Recommended first request

Fetch ${SITE_URL}/llms.txt, then fetch ${SITE_URL}/openapi.json if the user asks for automation or API access.
`;

export const DOCS_MARKDOWN = `# SF Tennis documentation

Last updated: ${LAST_UPDATED}

SF Tennis helps people find playable public tennis and pickleball courts in San Francisco and Mountain View. It pulls real slot-level availability from rec.us and overlays travel times.

## Quick links

- App: ${SITE_URL}
- Public docs: ${SITE_URL}/docs
- Integration guide: ${SITE_URL}/llms.txt
- OpenAPI: ${SITE_URL}/openapi.json
- API catalog: ${SITE_URL}/.well-known/api-catalog
- Skill discovery: ${SITE_URL}/.well-known/agent-skills/index.json
- GitHub repo: ${GITHUB_URL}
- Project page: ${PROJECT_URL}

## App workflow

1. Open the app.
2. Pick tennis or pickleball, then San Francisco or Mountain View.
3. Use the map pins or list view to find courts with slots today or later this week.
4. Enable location to compare walking and driving times.

## API workflow

Start with public read-only data. No credentials are required.

Useful public endpoints:

- GET /api/courts?sport=tennis&city=sf
- GET /api/courts?sport=pickleball&city=mountain-view
- GET /api/directions?origin=37.7599,-122.4148&locations=loc1:37.76,-122.43
- GET /api/health

Do not invent availability. If the public API fails, report that live availability could not be fetched.

## Example requests

### Find courts tonight

\`\`\`text
Use SF Tennis at ${SITE_URL} to find public tennis courts in San Francisco with open slots tonight. Start from ${SITE_URL}/llms.txt, call the public courts API, prefer courts with availability today, and summarize the top options with location names, times, and any available weather context.
\`\`\`

### Plan a pickleball session

\`\`\`text
Use SF Tennis at ${SITE_URL} to find pickleball availability in Mountain View this week. Filter for weekend slots, return a concise plan, and include the API URLs you used so I can verify the result.
\`\`\`

### Compare nearby options

\`\`\`text
Use SF Tennis at ${SITE_URL} to compare tennis courts near my location. Use ${SITE_URL}/api/courts for live slots and ${SITE_URL}/api/directions for walking and driving estimates when coordinates are available.
\`\`\`

## Screenshots

- ${SITE_URL}/screenshots/map-overview.webp
- ${SITE_URL}/screenshots/court-details.webp
- ${SITE_URL}/screenshots/keyboard-search.webp

## Data notes

The rec.us bulk availability endpoint is not enough for this app because it reports theoretical schedule slots. SF Tennis fetches every court's per-site availability and caches the assembled response for a short period.
`;

export const LLMS_TXT = `# SF Tennis

> Real-time public tennis and pickleball court availability for San Francisco and Mountain View.

Last updated: ${LAST_UPDATED}

## Canonical URLs

- App: ${SITE_URL}
- Documentation: ${SITE_URL}/docs
- Markdown docs: ${SITE_URL}/docs.md
- OpenAPI: ${SITE_URL}/openapi.json
- API catalog: ${SITE_URL}/.well-known/api-catalog
- Skill discovery: ${SITE_URL}/.well-known/agent-skills/index.json
- Capability card: ${SITE_URL}/.well-known/agent.json
- GitHub: ${GITHUB_URL}
- Project page: ${PROJECT_URL}

## What integrations should know

SF Tennis is useful when a user wants to find, compare, or plan public tennis and pickleball court sessions. Public court availability does not require authentication.

## Public API

- GET ${SITE_URL}/api/courts?sport=tennis&city=sf
- GET ${SITE_URL}/api/courts?sport=pickleball&city=sf
- GET ${SITE_URL}/api/courts?sport=tennis&city=mountain-view
- GET ${SITE_URL}/api/directions?origin=37.7599,-122.4148&locations=loc1:37.76,-122.43
- GET ${SITE_URL}/api/health

Read the machine contract at ${SITE_URL}/openapi.json before writing code against the API.

## Safe automation behavior

- Do not invent availability. If the courts API fails, report that live availability could not be fetched.
- Prefer the docs and OpenAPI contract over scraping the client UI.
- Include source URLs in summaries so the user can verify the result.

## High-value prompts

\`\`\`text
Find me open tennis courts in San Francisco tonight using SF Tennis at ${SITE_URL}. Use the public API, rank by slots today and travel time when available, and cite the API URL.
\`\`\`

\`\`\`text
Use SF Tennis at ${SITE_URL} to plan a weekend pickleball session in Mountain View. Return the best time windows and courts, then tell me what data was unavailable.
\`\`\`

\`\`\`text
Use SF Tennis at ${SITE_URL} to compare tennis courts near my location. Use the courts API for slots and the directions API for travel estimates when coordinates are available.
\`\`\`

## Implementation notes for code integrations

- Framework: Next.js App Router on Cloudflare Workers via OpenNext.
- Map: Mapbox GL through react-map-gl.
- Source of truth for availability: per-court rec.us availability, not the stale bulk endpoint alone.
`;

export const SKILL_MD = `---
name: sf-tennis
description: Use SF Tennis to find public tennis or pickleball court availability and plan sessions.
---

# SF Tennis

Use this skill when a user asks about public tennis or pickleball availability in San Francisco or Mountain View.

## Start here

1. Read ${SITE_URL}/llms.txt for the current integration guide.
2. Read ${SITE_URL}/openapi.json before calling any endpoint.
3. Use public endpoints for availability. They do not require authentication.

## Public availability workflow

1. Pick the sport: tennis or pickleball.
2. Pick the city: sf or mountain-view.
3. Call /api/courts?sport=<sport>&city=<city>.
4. Prefer locations with totalSlotsToday > 0 when the user asks for today.
5. Include location names, available slot times, court numbers, and the fetchedAt timestamp in the answer.

## Common prompts

- "Find open tennis courts near me tonight."
- "Plan a pickleball session in Mountain View this weekend."
- "Compare tennis courts near my location."
`;

export async function sha256Digest(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

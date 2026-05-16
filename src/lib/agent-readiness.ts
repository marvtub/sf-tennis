export const SITE_URL = "https://tennis.marvinaziz.de";
export const GITHUB_URL = "https://github.com/marvtub/sf-tennis";
export const LAST_UPDATED = "2026-05-16";

export const DISCOVERY_LINK_HEADER = [
  '</llms.txt>; rel="alternate"; type="text/markdown"; title="llms.txt"',
  '</docs>; rel="help"; type="text/html"; title="SF Tennis agent docs"',
  '</docs.md>; rel="alternate"; type="text/markdown"; title="SF Tennis docs"',
  '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"; type="application/json"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
  '</.well-known/agent.json>; rel="agent-card"; type="application/json"',
].join(", ");

export const HOME_MARKDOWN = `# SF Tennis

Real-time availability map and API for public tennis and pickleball courts in San Francisco and Mountain View.

Canonical site: ${SITE_URL}
Human and agent docs: ${SITE_URL}/docs
Repository: ${GITHUB_URL}

## What this app does

- Shows live court availability from rec.us using per-court availability checks.
- Supports tennis and pickleball in San Francisco and Mountain View.
- Adds travel-time overlays from a user's location through Mapbox Directions.
- Keeps optional personal data, such as favourites, friends, and match history, behind PIN auth.
- Exposes a public courts API and an API-key protected history API for user-owned automations.

## Agent entry points

- Agent guide: ${SITE_URL}/llms.txt
- Markdown docs: ${SITE_URL}/docs.md
- OpenAPI contract: ${SITE_URL}/openapi.json
- API catalog: ${SITE_URL}/.well-known/api-catalog
- OAuth authorization metadata: ${SITE_URL}/.well-known/oauth-authorization-server
- OAuth protected resource metadata: ${SITE_URL}/.well-known/oauth-protected-resource
- Agent skills: ${SITE_URL}/.well-known/agent-skills/index.json

## Recommended first request

Fetch ${SITE_URL}/llms.txt, then fetch ${SITE_URL}/openapi.json if the user asks for automation or API access.
`;

export const DOCS_MARKDOWN = `# SF Tennis agent and human docs

Last updated: ${LAST_UPDATED}

SF Tennis helps people find playable public tennis and pickleball courts in San Francisco and Mountain View. It pulls real slot-level availability from rec.us, overlays travel times, and keeps personal favourites, friends, and match history private behind PIN auth.

## Quick links

- App: ${SITE_URL}
- Public docs: ${SITE_URL}/docs
- Agent guide: ${SITE_URL}/llms.txt
- OpenAPI: ${SITE_URL}/openapi.json
- API catalog: ${SITE_URL}/.well-known/api-catalog
- OAuth authorization metadata: ${SITE_URL}/.well-known/oauth-authorization-server
- OAuth protected resource metadata: ${SITE_URL}/.well-known/oauth-protected-resource
- Agent skills: ${SITE_URL}/.well-known/agent-skills/index.json
- GitHub repo: ${GITHUB_URL}

## For humans

1. Open the app.
2. Pick tennis or pickleball, then San Francisco or Mountain View.
3. Use the map pins or list view to find courts with slots today or later this week.
4. Enable location to compare walking and driving times.
5. Log in with the private PIN to save favourites, add friends, and log match history.

## For agents

Start with read-only data unless the user explicitly provides an API key and asks you to update their match history.

Useful public endpoints:

- GET /api/courts?sport=tennis&city=sf
- GET /api/courts?sport=pickleball&city=mountain-view
- GET /api/directions?origin=37.7599,-122.4148&locations=loc1:37.76,-122.43
- GET /api/health

Protected automation endpoint:

- /api/history/external requires Authorization: Bearer <API_KEY>
- GET lists history, friend display names, and a courts API hint.
- POST creates a match entry.
- PUT updates a match entry.
- DELETE deletes a match entry.
- OAuth-style client_credentials metadata is published for discovery. If the user gives you the API key as a client_secret, /oauth/token can exchange it for the same bearer token shape used by /api/history/external.

Do not guess or invent API keys, PINs, home addresses, friend addresses, or private history. Ask the user for credentials out of band when needed.

## Prompt pack

### Find courts tonight

\`\`\`text
Use SF Tennis to find public tennis courts in San Francisco with open slots tonight. Start from /llms.txt, call the public courts API, prefer courts with availability today, and summarize the top options with location names, times, and any available weather context.
\`\`\`

### Plan a pickleball session

\`\`\`text
Use SF Tennis to find pickleball availability in Mountain View this week. Filter for weekend slots, return a concise plan, and include the API URLs you used so I can verify the result.
\`\`\`

### Log a match

\`\`\`text
I will provide my SF Tennis API key. Use /api/history/external to add a match history entry after confirming the exact court, date, time, friends, and notes with me. Never expose the API key in your answer.
\`\`\`

## Screenshots

- ${SITE_URL}/screenshots/map-overview.webp
- ${SITE_URL}/screenshots/court-details.webp
- ${SITE_URL}/screenshots/agent-history.webp

## Data notes

The rec.us bulk availability endpoint is not enough for this app because it reports theoretical schedule slots. SF Tennis fetches every court's per-site availability and caches the assembled response for a short period.
`;

export const LLMS_TXT = `# SF Tennis

> Real-time public tennis and pickleball court availability for San Francisco and Mountain View, built as an agent-readable portfolio app.

Last updated: ${LAST_UPDATED}

## Canonical URLs

- App: ${SITE_URL}
- Human docs: ${SITE_URL}/docs
- Markdown docs: ${SITE_URL}/docs.md
- OpenAPI: ${SITE_URL}/openapi.json
- API catalog: ${SITE_URL}/.well-known/api-catalog
- OAuth authorization metadata: ${SITE_URL}/.well-known/oauth-authorization-server
- OAuth protected resource metadata: ${SITE_URL}/.well-known/oauth-protected-resource
- Agent skills: ${SITE_URL}/.well-known/agent-skills/index.json
- A2A-style agent card: ${SITE_URL}/.well-known/agent.json
- GitHub: ${GITHUB_URL}

## What agents should know

SF Tennis is useful when a user wants to find, compare, or log public tennis and pickleball court sessions. Public court availability does not require authentication. Personal favourites, friend data, and match history are private.

## Public API

- GET ${SITE_URL}/api/courts?sport=tennis&city=sf
- GET ${SITE_URL}/api/courts?sport=pickleball&city=sf
- GET ${SITE_URL}/api/courts?sport=tennis&city=mountain-view
- GET ${SITE_URL}/api/directions?origin=37.7599,-122.4148&locations=loc1:37.76,-122.43
- GET ${SITE_URL}/api/health

Read the machine contract at ${SITE_URL}/openapi.json before writing code against the API.

## Protected API

${SITE_URL}/api/history/external uses a bearer API key. Use it only when the user explicitly supplies an API key and asks you to read or modify their match history.

For agents that require OAuth discovery, SF Tennis publishes OAuth authorization server metadata and OAuth protected resource metadata. The token endpoint supports client_credentials by treating the user-provided API key as the client_secret and returns a bearer token for the same protected history API.

## Safe agent behavior

- Do not ask for or reveal the browser PIN unless the user is logging in directly.
- Do not invent availability. If the courts API fails, report that live availability could not be fetched.
- Do not expose exact friend addresses or private history in public output.
- Prefer the docs and OpenAPI contract over scraping the client UI.
- Include source URLs in summaries so the human can verify the result.

## High-value prompts

\`\`\`text
Find me open tennis courts in San Francisco tonight using SF Tennis. Use the public API, rank by slots today and travel time when available, and cite the API URL.
\`\`\`

\`\`\`text
Use SF Tennis to plan a weekend pickleball session in Mountain View. Return the best time windows and courts, then tell me what data was unavailable.
\`\`\`

\`\`\`text
Use my SF Tennis API key to log a match. Confirm the location, date, time, court number, friends, and notes before sending the POST request.
\`\`\`

## Implementation notes for code agents

- Framework: Next.js App Router on Cloudflare Workers via OpenNext.
- Map: Mapbox GL through react-map-gl.
- Persistence: Cloudflare D1 in production, local JSON fallback in dev.
- Source of truth for availability: per-court rec.us availability, not the stale bulk endpoint alone.
`;

export const SKILL_MD = `---
name: sf-tennis
description: Use SF Tennis to find public tennis or pickleball court availability, plan sessions, and safely work with the user's match history API.
---

# SF Tennis

Use this skill when a user asks about public tennis or pickleball availability in San Francisco or Mountain View, or asks an agent to log SF Tennis match history.

## Start here

1. Read ${SITE_URL}/llms.txt for the current agent guide.
2. Read ${SITE_URL}/openapi.json before calling any endpoint.
3. Use public endpoints for availability. They do not require authentication.
4. Use /api/history/external only when the user explicitly provides an API key.
5. If the agent requires OAuth discovery, read /.well-known/oauth-authorization-server and /.well-known/oauth-protected-resource. The client_credentials exchange accepts the user-provided API key as client_secret.

## Public availability workflow

1. Pick the sport: tennis or pickleball.
2. Pick the city: sf or mountain-view.
3. Call /api/courts?sport=<sport>&city=<city>.
4. Prefer locations with totalSlotsToday > 0 when the user asks for today.
5. Include location names, available slot times, court numbers, and the fetchedAt timestamp in the answer.

## Private history workflow

1. Ask the user to provide the API key outside public chat if needed.
2. Confirm the exact mutation before POST, PUT, or DELETE.
3. Never print bearer tokens.
4. Keep friend home addresses and private history out of public summaries.

## Common prompts

- "Find open tennis courts near me tonight."
- "Plan a pickleball session in Mountain View this weekend."
- "Log my match at Dolores Park on Friday at 5 pm."
`;

export async function sha256Digest(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

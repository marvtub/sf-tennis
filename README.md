# SF Tennis

Real-time public tennis and pickleball availability for San Francisco and
Mountain View.

[Live app](https://tennis.marvinaziz.de) |
[Docs](https://tennis.marvinaziz.de/docs) |
[OpenAPI](https://tennis.marvinaziz.de/openapi.json)

<!-- README preview (animated, no sound). Click for the project page. -->

[![SF Tennis demo](.github/demo.gif)](https://tennis.marvinaziz.de)

## What It Does

SF Tennis is a map-first browser for public court availability. It pulls actual
slot-level openings from rec.us, adds weather and travel context, and keeps a
small public API surface for users, agents, and scripts.

- Shows live tennis and pickleball slots for San Francisco and Mountain View.
- Fetches per-court rec.us availability instead of relying on stale bulk slots.
- Adds walking and driving estimates through a server-side Mapbox proxy.
- Publishes docs, Markdown, OpenAPI, API catalog, and agent skill discovery.
- Runs on Next.js App Router and Cloudflare Workers via OpenNext.

## Public Surfaces

| Surface | URL | Use |
| --- | --- | --- |
| App | [`/`](https://tennis.marvinaziz.de) | Map UI for finding courts |
| Docs | [`/docs`](https://tennis.marvinaziz.de/docs) | Human-readable guide, screenshots, prompts |
| Markdown docs | [`/docs.md`](https://tennis.marvinaziz.de/docs.md) | Text mirror for agents and tools |
| Agent guide | [`/llms.txt`](https://tennis.marvinaziz.de/llms.txt) | Compact integration starting point |
| OpenAPI | [`/openapi.json`](https://tennis.marvinaziz.de/openapi.json) | Machine-readable API contract |
| API catalog | [`/.well-known/api-catalog`](https://tennis.marvinaziz.de/.well-known/api-catalog) | RFC 9727 linkset discovery |
| Agent card | [`/.well-known/agent.json`](https://tennis.marvinaziz.de/.well-known/agent.json) | Capability metadata |
| Agent skills | [`/.well-known/agent-skills/index.json`](https://tennis.marvinaziz.de/.well-known/agent-skills/index.json) | Skill discovery |

The homepage and docs also support Markdown content negotiation:

```bash
curl -H 'Accept: text/markdown' https://tennis.marvinaziz.de/
curl -H 'Accept: text/markdown' https://tennis.marvinaziz.de/docs
```

## Public API

All current API routes are public and read-only.

```bash
curl 'https://tennis.marvinaziz.de/api/courts?sport=tennis&city=sf'
curl 'https://tennis.marvinaziz.de/api/courts?sport=pickleball&city=mountain-view'
curl 'https://tennis.marvinaziz.de/api/directions?origin=37.7599,-122.4148&locations=dolores:37.7599,-122.4270'
curl 'https://tennis.marvinaziz.de/api/health'
```

Supported query values:

- `sport`: `tennis` or `pickleball`
- `city`: `sf` or `mountain-view`
- `origin`: `lat,lng`
- `locations`: pipe-delimited `id:lat,lng` entries, capped at 50 locations

For agent or script integrations, start with
[`/llms.txt`](https://tennis.marvinaziz.de/llms.txt), then read
[`/openapi.json`](https://tennis.marvinaziz.de/openapi.json) before calling the
API.

## Stack

- Next.js 16 App Router and React 19
- Tailwind CSS v4
- Mapbox GL via `react-map-gl`
- Cloudflare Workers deployment through `@opennextjs/cloudflare`
- rec.us for court metadata and per-court availability
- Open-Meteo for best-effort slot weather

## Local Development

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Required environment variables:

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Browser | Mapbox map tiles |
| `MAPBOX_SECRET_TOKEN` | Server | Mapbox Directions proxy |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run typecheck` | Run TypeScript without building |
| `npm run build` | Build the production Next.js app |
| `npm run cf:build` | Build the Cloudflare Worker bundle in `.open-next/` |
| `npm run cf:dev` | Run the built Worker locally with Wrangler |
| `npm run cf:deploy` | Deploy to Cloudflare Workers |

## Implementation Notes

- The rec.us bulk availability endpoint is not enough. It reports theoretical
  schedule slots, so this app fetches every site's per-court availability and
  caches the assembled response for 2 minutes.
- `/api/directions` keeps the secret Mapbox token server-side and caches travel
  estimates for 24 hours.
- `next/image` optimization is disabled because Cloudflare Workers does not
  support it in this setup.
- Rate limiting is per-isolate and in-memory. It is an abuse guard, not a
  billing or product quota.
- The app has no login, friends, favourites, private match history, D1 database,
  OAuth, or protected API surface.

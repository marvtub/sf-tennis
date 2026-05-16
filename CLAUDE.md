# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (default, hits real rec.us + Mapbox APIs; uses `.data.json` for persistence)
- `npm run build` — Next.js production build (also runs typecheck via `tsc` through Next)
- `npm run cf:build` — Build the Cloudflare Workers bundle via `@opennextjs/cloudflare` (output in `.open-next/`)
- `npm run cf:dev` — Run the built Worker locally with Wrangler
- `npm run cf:deploy` — Deploy to Cloudflare Workers (route: `tennis.marvinaziz.de/*`)

There is no test suite, no linter config, and no formatter — don't invent commands that aren't in `package.json`.

## Architecture

Next.js 16 (App Router) frontend deployed to **Cloudflare Workers** via OpenNext. The app is a map-based browser for real-time tennis/pickleball court availability.

### Documentation and discovery surface

Public docs and discovery live in static App Router routes:

- `/docs` documentation with screenshots and example requests.
- `/llms.txt` and `/llm.txt` compact integration guide.
- `/docs.md` markdown mirror of the docs page.
- `/openapi.json` OpenAPI 3.1 contract for public availability, directions, and health APIs.
- `/.well-known/api-catalog`, `/.well-known/agent.json`, and `/.well-known/agent-skills/index.json` for discovery.

`src/middleware.ts` also adds Link discovery headers on `/` and `/docs`, and serves markdown for those pages when `Accept: text/markdown` is requested. Keep these routes truthful: the app exposes public availability and travel data, not private user data, OAuth, or MCP access.

### Data flow for court availability (`src/lib/recus.ts`)

rec.us's bulk availability endpoint returns *theoretical* schedule slots — it does **not** reflect actual bookings. The code deliberately does a two-step fetch:

1. Bulk `/v1/locations/availability` → location metadata + list of court IDs.
2. Per-court `/v1/sites/{id}/availability` for **every court** (batched 15 at a time) → real slots.

This fans out to ~100 API calls per refresh, which is why `AVAILABILITY_CACHE_SECONDS = 120` in `src/lib/constants.ts` and why `/api/courts` sets `s-maxage=120, stale-while-revalidate=300`. Don't "optimize" back to the single bulk call — availability will be wrong.

After availability is assembled, `enrichCourtsWithWeather` (`src/lib/weather.ts`) batches Open-Meteo forecast calls per location and attaches hourly `SlotWeather` to each slot. The enrichment is best-effort: failures return an empty weather map rather than throwing.

Cities are configured in `CITIES` (`src/lib/constants.ts`) and piped through as the `organizationSlug` query param. Sports are filtered client-side of rec.us by matching `sportId` against `SPORT_ID_TENNIS` / `SPORT_ID_PICKLEBALL`.

### Rate limiting

Rate limiting (`src/middleware.ts`) is in-memory per-IP — **resets on every deploy** and is per-isolate, not global. It's a coarse guard, not a real quota. The middleware also 403s common SEO bots on `/` to avoid burning Mapbox loads.

### Frontend composition (`src/app/page.tsx`)

The home page is the single stateful root. It composes feature hooks (`useCourts`, `useTravelTimes`, `useUserLocation`) and passes slices down to presentational components. `MapView` uses `react-map-gl` + Mapbox GL; `/api/directions` proxies Mapbox Directions with a 24h cache so the client never sees the secret token.

### Deployment details

- `next.config.ts` disables `next/image` optimization because CF Workers doesn't support it.
- `open-next.config.ts` is intentionally empty — default adapter behaviour is what we want.
- `wrangler.jsonc` wires the `ASSETS` binding for static files and the production route.

## Environment variables

Required in `.env.local` for dev and as Worker secrets in prod:

- `NEXT_PUBLIC_MAPBOX_TOKEN` — public Mapbox token for map tiles (shipped to browser).
- `MAPBOX_SECRET_TOKEN` — server-side Mapbox token for `/api/directions`.

# AGENTS.md

This guide is for coding agents working in this repository. Keep it aligned
with `CLAUDE.md`.

## Current Product Boundary

SF Tennis is a public, map-first court availability app. It shows tennis and
pickleball availability for San Francisco and Mountain View, plus weather and
travel context.

Do not reintroduce login, friends, favourites, private match history, D1
persistence, OAuth metadata, bearer-token APIs, or protected user data unless
the user explicitly asks for a new private feature.

## Commands

- `npm run dev` - Next.js dev server. It calls real rec.us and Mapbox APIs.
- `npm run typecheck` - TypeScript check without a production bundle.
- `npm run build` - Next.js production build.
- `npm run cf:build` - Build the Cloudflare Workers bundle in `.open-next/`.
- `npm run cf:dev` - Run the built Worker locally with Wrangler.
- `npm run cf:deploy` - Deploy to Cloudflare Workers.

There is no test suite, no linter config, and no formatter. Do not invent
commands that are not in `package.json`.

## Architecture

- Next.js 16 App Router frontend deployed to Cloudflare Workers via OpenNext.
- The home page is `src/app/page.tsx`; it composes `useCourts`,
  `useTravelTimes`, and `useUserLocation`.
- `MapView` uses `react-map-gl` and Mapbox GL. `/api/directions` proxies Mapbox
  Directions so the browser never receives the secret token.
- Tailwind CSS v4 is used directly through `src/app/globals.css`.
- The docs page in `src/app/docs/page.tsx` uses a Mintlify-style left nav,
  right "On this page" rail, clickable screenshot previews, and a light/dark
  toggle. Light mode is the default.

## Public Routes

- `/` - app UI.
- `/docs` - documentation page.
- `/docs.md`, `/llms.txt`, `/llm.txt` - text documentation for agents/tools.
- `/openapi.json` - OpenAPI 3.1 contract.
- `/.well-known/api-catalog`, `/.well-known/agent.json`,
  `/.well-known/agent-card.json`, `/.well-known/agent-skills/index.json`, and
  `/.well-known/agent-skills/sf-tennis/SKILL.md` - discovery metadata.
- `/api/courts`, `/api/directions`, `/api/health` - public API routes.

`src/middleware.ts` adds Link discovery headers on `/` and `/docs`, serves
Markdown for those pages when `Accept: text/markdown` is requested, applies
security headers, and rate-limits API/page requests.

## Availability Data Flow

rec.us's bulk availability endpoint returns theoretical schedule slots. It does
not reflect actual bookings. Keep the existing two-step flow in
`src/lib/recus.ts`:

1. Fetch bulk `/v1/locations/availability` for location metadata and court IDs.
2. Fetch `/v1/sites/{id}/availability` for every court, batched 15 at a time.

After availability is assembled, `enrichCourtsWithWeather` in
`src/lib/weather.ts` batches Open-Meteo forecast calls per location. Weather is
best effort: failures should return empty weather data rather than failing the
court response.

Cities live in `CITIES` in `src/lib/constants.ts`. Sports are filtered by
`SPORT_ID_TENNIS` and `SPORT_ID_PICKLEBALL`.

## Environment

Required in `.env.local` for development and as Worker secrets in production:

- `NEXT_PUBLIC_MAPBOX_TOKEN` - public Mapbox token for map tiles.
- `MAPBOX_SECRET_TOKEN` - server-side token for `/api/directions`.

## Verification

For ordinary code changes, run:

```bash
npm run typecheck
npm run build
```

For Worker/deployment-sensitive changes, also run:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.test MAPBOX_SECRET_TOKEN=pk.test npm run cf:build
```

For docs or visual changes, use Playwright screenshots and a Lighthouse pass on
`/docs` when practical. Check desktop and mobile for horizontal overflow, broken
theme states, and screenshot modal behavior.

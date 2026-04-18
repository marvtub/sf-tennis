# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (default, hits real rec.us + Mapbox APIs; uses `.data.json` for persistence)
- `npm run build` — Next.js production build (also runs typecheck via `tsc` through Next)
- `npm run cf:build` — Build the Cloudflare Workers bundle via `@opennextjs/cloudflare` (output in `.open-next/`)
- `npm run cf:dev` — Run the built Worker locally with Wrangler (uses real D1 binding if configured)
- `npm run cf:deploy` — Deploy to Cloudflare Workers (route: `tennis.marvinaziz.de/*`)
- D1 schema lives in `schema.sql`; apply with `npx wrangler d1 execute sf-tennis-db --file=schema.sql` (add `--remote` for prod).

There is no test suite, no linter config, and no formatter — don't invent commands that aren't in `package.json`.

## Architecture

Next.js 16 (App Router) frontend deployed to **Cloudflare Workers** via OpenNext. The app is a map-based browser for real-time tennis/pickleball court availability, with a small authenticated layer for personal data (favourites, friends, match history).

### Data flow for court availability (`src/lib/recus.ts`)

rec.us's bulk availability endpoint returns *theoretical* schedule slots — it does **not** reflect actual bookings. The code deliberately does a two-step fetch:

1. Bulk `/v1/locations/availability` → location metadata + list of court IDs.
2. Per-court `/v1/sites/{id}/availability` for **every court** (batched 15 at a time) → real slots.

This fans out to ~100 API calls per refresh, which is why `AVAILABILITY_CACHE_SECONDS = 120` in `src/lib/constants.ts` and why `/api/courts` sets `s-maxage=120, stale-while-revalidate=300`. Don't "optimize" back to the single bulk call — availability will be wrong.

After availability is assembled, `enrichCourtsWithWeather` (`src/lib/weather.ts`) batches Open-Meteo forecast calls per location and attaches hourly `SlotWeather` to each slot. The enrichment is best-effort: failures return an empty weather map rather than throwing.

Cities are configured in `CITIES` (`src/lib/constants.ts`) and piped through as the `organizationSlug` query param. Sports are filtered client-side of rec.us by matching `sportId` against `SPORT_ID_TENNIS` / `SPORT_ID_PICKLEBALL`.

### Persistence: D1 with a local JSON fallback (`src/lib/db.ts`)

In Workers, `getDb()` pulls the D1 binding via `getCloudflareContext().env.DB` (the `require` trick in `getDb` is there on purpose — it avoids the bundler statically resolving `@opennextjs/cloudflare` during Next's build). In local `next dev` there is no binding, so every db function falls through to a JSON read/write against `.data.json` at the repo root. Both paths must stay in sync when you add a new query.

Schema (`schema.sql`): `favourites`, `friends`, `play_history`, and a many-to-many `play_history_friends`.

### Auth & rate limiting

Two separate auth mechanisms:

- **Browser PIN auth** (`src/lib/auth.ts`): single `AUTH_PIN` env var, session is a base64-encoded `{ts, pin}` blob stored in the `sf-tennis-session` cookie, verified with a constant-time compare. Guards personal-data routes via `requireAuth()` (`src/lib/auth-guard.ts`).
- **API-key auth** (`src/app/api/history/external/route.ts`): `Authorization: Bearer <API_KEY>` header, timing-safe compare, separate rate limit. Designed for agents/automations to read/write `play_history`.

Rate limiting (`src/middleware.ts`) is in-memory per-IP — **resets on every deploy** and is per-isolate, not global. It's a coarse guard, not a real quota. The middleware also 403s common SEO bots on `/` to avoid burning Mapbox loads.

### Frontend composition (`src/app/page.tsx`)

The home page is the single stateful root. It composes feature hooks (`useCourts`, `useTravelTimes`, `useUserLocation`, `useAuth`, `useFavourites`, `useFriends`, `useHistory`) and passes slices down to presentational components. Dialogs and `HistoryPanel` are `next/dynamic`-imported to keep initial JS small. `MapView` uses `react-map-gl` + Mapbox GL; `/api/directions` proxies Mapbox Directions with a 24h cache so the client never sees the secret token.

### Deployment details

- `next.config.ts` disables `next/image` optimization because CF Workers doesn't support it.
- `open-next.config.ts` is intentionally empty — default adapter behaviour is what we want.
- `wrangler.jsonc` wires the D1 binding, the `ASSETS` binding for static files, and the production route. `compatibility_flags: ["nodejs_compat"]` is required (db.ts uses `fs` in the local fallback path, and Buffer in auth.ts).

## Environment variables

Required in `.env.local` for dev and as Worker secrets in prod:

- `NEXT_PUBLIC_MAPBOX_TOKEN` — public Mapbox token for map tiles (shipped to browser).
- `MAPBOX_SECRET_TOKEN` — server-side Mapbox token for `/api/directions`.
- `AUTH_PIN` — PIN for browser login.
- `API_KEY` — bearer token for `/api/history/external`.

<!-- Demo video. GitHub renders mp4 files committed to the repo inline. -->

https://github.com/marvtub/sf-tennis/raw/refs/heads/master/.github/demo.mp4

# SF Tennis

Real-time availability map for public tennis and pickleball courts in San Francisco and Mountain View. Live at [tennis.marvinaziz.de](https://tennis.marvinaziz.de).

Pulls actual slot-level availability from rec.us (not the stale bulk schedule), overlays travel times from your location, and keeps a small personal layer for favourites, friends, and match history behind a PIN.

## Stack

- Next.js 16 (App Router) + React 19, deployed to Cloudflare Workers via [`@opennextjs/cloudflare`](https://github.com/opennextjs/opennextjs-cloudflare)
- Cloudflare D1 for persistence (local dev falls back to a `.data.json` file)
- Mapbox GL + `react-map-gl` for the map, Mapbox Directions for travel times
- Tailwind CSS v4

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Var | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | browser | Map tiles |
| `MAPBOX_SECRET_TOKEN` | server | Directions API (walking + driving) |
| `AUTH_PIN` | server | Browser PIN login |
| `API_KEY` | server | Bearer token for the external history API |

### D1 setup

```bash
npx wrangler d1 create sf-tennis-db           # only once; paste id into wrangler.jsonc
npx wrangler d1 execute sf-tennis-db --file=schema.sql            # local
npx wrangler d1 execute sf-tennis-db --remote --file=schema.sql   # prod
```

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Next production build |
| `npm run cf:build` | Build the Worker bundle (`.open-next/`) |
| `npm run cf:dev` | Run the Worker locally via Wrangler |
| `npm run cf:deploy` | Deploy to Cloudflare |

## External API

Agents and automations can read/write match history with a bearer token:

```bash
curl -H "Authorization: Bearer $API_KEY" https://tennis.marvinaziz.de/api/history/external
```

`GET` returns `{ history, friends, courtsUrl }`. `POST`/`PUT`/`DELETE` accept JSON bodies — see `src/app/api/history/external/route.ts` for the exact shape.

## Notes

- The bulk `rec.us` availability endpoint reports theoretical slots, not real availability. This app fetches per-court availability for every court on every refresh, which is why responses are cached for 2 minutes.
- `next/image` optimization is off — Cloudflare Workers doesn't support it.
- Rate limiting is per-isolate in-memory; it's a coarse abuse guard, not a real quota.

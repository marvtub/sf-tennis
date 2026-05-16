<!-- README preview (animated, no sound). Click for the project page. -->

[![Demo](.github/demo.gif)](https://marvinaziz.de/projects#sf-tennis-court-finder)

# SF Tennis

Real-time availability map for public tennis and pickleball courts in San Francisco and Mountain View. Live at [tennis.marvinaziz.de](https://tennis.marvinaziz.de).

Pulls actual slot-level availability from rec.us (not the stale bulk schedule), overlays travel times from your location, and keeps a small personal layer for favourites and match history behind a PIN.

## Documentation and API

SF Tennis publishes regular docs, a Markdown mirror, and an OpenAPI contract so the app can be inspected without reverse-engineering the React map UI.

| Surface | URL | Purpose |
| --- | --- | --- |
| Docs | [`/docs`](https://tennis.marvinaziz.de/docs) | Screenshots, example requests, API examples |
| Integration guide | [`/llms.txt`](https://tennis.marvinaziz.de/llms.txt) | Compact overview and recommended API workflow |
| Markdown docs | [`/docs.md`](https://tennis.marvinaziz.de/docs.md) | Markdown mirror for tools that prefer text |
| OpenAPI | [`/openapi.json`](https://tennis.marvinaziz.de/openapi.json) | Machine-readable API contract |
| API catalog | [`/.well-known/api-catalog`](https://tennis.marvinaziz.de/.well-known/api-catalog) | RFC 9727 linkset discovery |
| OAuth metadata | [`/.well-known/oauth-authorization-server`](https://tennis.marvinaziz.de/.well-known/oauth-authorization-server) | OAuth discovery for the history API |
| Protected resource | [`/.well-known/oauth-protected-resource`](https://tennis.marvinaziz.de/.well-known/oauth-protected-resource) | OAuth protected resource metadata |

The homepage also supports Markdown content negotiation:

```bash
curl -H 'Accept: text/markdown' https://tennis.marvinaziz.de/
```

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
| `SESSION_SECRET` | server | HMAC secret for signed session cookies. Falls back to an `AUTH_PIN`-derived key if unset. |
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
| `npm run typecheck` | TypeScript check without a production bundle |
| `npm run build` | Next production build |
| `npm run cf:build` | Build the Worker bundle (`.open-next/`) |
| `npm run cf:dev` | Run the Worker locally via Wrangler |
| `npm run cf:deploy` | Deploy to Cloudflare |

## External API

Authorized clients can read/write match history with a bearer token:

```bash
curl -H "Authorization: Bearer $API_KEY" https://tennis.marvinaziz.de/api/history/external
```

`GET` returns `{ history, courtsUrl }`. `POST`/`PUT`/`DELETE` accept JSON bodies — see `src/app/api/history/external/route.ts` for the exact shape.

Clients should read [`/llms.txt`](https://tennis.marvinaziz.de/llms.txt) and [`/openapi.json`](https://tennis.marvinaziz.de/openapi.json) before calling this endpoint, and should never print bearer tokens or private history in public output.

For clients that require OAuth-style discovery, `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` describe a `client_credentials` flow where the user-provided `API_KEY` is used as `client_secret` and exchanged at `/oauth/token` for the same bearer token shape.

## Notes

- The bulk `rec.us` availability endpoint reports theoretical slots, not real availability. This app fetches per-court availability for every court on every refresh, which is why responses are cached for 2 minutes.
- `next/image` optimization is off — Cloudflare Workers doesn't support it.
- Rate limiting is per-isolate in-memory; it's a coarse abuse guard, not a real quota.

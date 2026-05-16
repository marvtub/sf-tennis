import type { Metadata } from "next";
import {
  GITHUB_PROFILE_URL,
  GITHUB_URL,
  LAST_UPDATED,
  LINKEDIN_URL,
  MARVIN_URL,
  PROJECT_URL,
  SITE_URL,
  X_URL,
} from "@/lib/agent-readiness";

export const metadata: Metadata = {
  title: "SF Tennis Documentation",
  description:
    "Documentation for SF Tennis court availability, API access, screenshots, and match history automation.",
  alternates: {
    canonical: "/docs",
    types: {
      "text/markdown": "/docs.md",
    },
  },
  openGraph: {
    title: "SF Tennis Documentation",
    description:
      "API docs, examples, screenshots, and integration notes for SF Tennis.",
    url: `${SITE_URL}/docs`,
    images: ["/screenshots/court-details.webp"],
  },
};

const navLinks = [
  ["Overview", "#overview"],
  ["Discovery", "#discovery"],
  ["Screenshots", "#screenshots"],
  ["Examples", "#examples"],
  ["API", "#api"],
  ["Safety", "#safety"],
  ["Links", "#links"],
];

const examples = [
  {
    title: "Find courts tonight",
    text: "Use SF Tennis to find public tennis courts in San Francisco with open slots tonight. Start from /llms.txt, call the public courts API, prefer courts with availability today, and summarize the top options with location names, times, and any available weather context.",
  },
  {
    title: "Plan a pickleball session",
    text: "Use SF Tennis to find pickleball availability in Mountain View this week. Filter for weekend slots, return a concise plan, and include the API URLs used so the result can be verified.",
  },
  {
    title: "Log a match",
    text: "I will provide my SF Tennis API key. Use /api/history/external to add a match history entry after confirming the exact court, date, time, and notes with me. Never expose the API key in your answer.",
  },
];

const discoveryLinks = [
  ["Integration guide", "/llms.txt"],
  ["Markdown docs", "/docs.md"],
  ["OpenAPI", "/openapi.json"],
  ["API catalog", "/.well-known/api-catalog"],
  ["OAuth metadata", "/.well-known/oauth-authorization-server"],
  ["Protected resource", "/.well-known/oauth-protected-resource"],
  ["GitHub repo", GITHUB_URL],
];

const socialLinks = [
  ["Project page", PROJECT_URL],
  ["Website", MARVIN_URL],
  ["GitHub", GITHUB_PROFILE_URL],
  ["X/Twitter", X_URL],
  ["LinkedIn", LINKEDIN_URL],
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#151713]">
      <section className="border-b border-[#d7dbc8] bg-[#f0f2e8]">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <nav className="flex flex-wrap items-center gap-3 text-sm text-[#4e5a46]">
            <a className="font-medium hover:text-[#151713]" href="/">
              SF Tennis
            </a>
            <span aria-hidden="true">/</span>
            <span>Docs</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#66724f]">
                Documentation
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                SF Tennis documentation
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#3e4538]">
                Find live public tennis and pickleball court availability,
                compare locations, and use the API for match history workflows.
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-[#cfd5bf] bg-white/70 p-4 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66724f]">
                  Updated
                </p>
                <p className="mt-1 font-medium">{LAST_UPDATED}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Availability" value="Live rec.us slots" />
                <Metric label="Cities" value="SF + Mountain View" />
                <Metric label="History API" value="Bearer key" />
                <Metric label="Runtime" value="Cloudflare" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav
            aria-label="Documentation sections"
            className="rounded-lg border border-[#d7dbc8] bg-white p-3 text-sm shadow-sm"
          >
            {navLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="block rounded-md px-3 py-2 font-medium text-[#4e5a46] transition hover:bg-[#eef4e7] hover:text-[#151713]"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="grid gap-12">
          <section id="overview" className="scroll-mt-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-2xl font-semibold">Start here</h2>
                <p className="mt-3 leading-7 text-[#485140]">
                  Open the app for the map-first experience. Use the API docs
                  when building integrations or automating match history.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/"
                  className="rounded-lg border border-[#d7dbc8] bg-white p-4 text-sm font-medium shadow-sm transition hover:border-[#87956c] hover:shadow-md"
                >
                  <span className="block text-[#151713]">Open app</span>
                  <span className="mt-1 block break-all text-xs text-[#647056]">
                    {SITE_URL}
                  </span>
                </a>
                <a
                  href="/openapi.json"
                  className="rounded-lg border border-[#d7dbc8] bg-white p-4 text-sm font-medium shadow-sm transition hover:border-[#87956c] hover:shadow-md"
                >
                  <span className="block text-[#151713]">API contract</span>
                  <span className="mt-1 block break-all text-xs text-[#647056]">
                    /openapi.json
                  </span>
                </a>
              </div>
            </div>
          </section>

          <section id="discovery" className="scroll-mt-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-semibold">Discovery</h2>
                <p className="mt-3 max-w-2xl leading-7 text-[#485140]">
                  These resources describe the public availability API, the
                  protected history API, and OAuth-compatible metadata.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {discoveryLinks.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg border border-[#d7dbc8] bg-white p-4 text-sm font-medium shadow-sm transition hover:border-[#87956c] hover:shadow-md"
                >
                  <span className="block text-[#151713]">{label}</span>
                  <span className="mt-1 block break-all text-xs text-[#647056]">
                    {href}
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section
            id="screenshots"
            className="scroll-mt-8 border-y border-[#d7dbc8] bg-white py-8"
          >
            <div className="px-0 md:px-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Product screenshots
                  </h2>
                  <p className="mt-3 max-w-2xl leading-7 text-[#485140]">
                    Current screenshots captured from the running product show
                    the map, court details, and fast keyboard search.
                  </p>
                </div>
                <a
                  className="text-sm font-semibold text-[#48622d] hover:text-[#1d2c13]"
                  href={PROJECT_URL}
                >
                  View project page
                </a>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <Screenshot
                  src="/screenshots/map-overview.webp"
                  alt="SF Tennis map overview of San Francisco court locations"
                  caption="Map-first court discovery"
                />
                <Screenshot
                  src="/screenshots/court-details.webp"
                  alt="SF Tennis court detail panel with live slot availability"
                  caption="Slot-level court details"
                />
                <Screenshot
                  src="/screenshots/keyboard-search.webp"
                  alt="SF Tennis keyboard search over public court locations"
                  caption="Fast keyboard search"
                />
              </div>
            </div>
          </section>

          <section id="examples" className="scroll-mt-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <div>
                <h2 className="text-2xl font-semibold">Example requests</h2>
                <p className="mt-3 leading-7 text-[#485140]">
                  These examples are written to produce useful, verifiable API
                  calls while keeping private data private.
                </p>
              </div>
              <div className="grid min-w-0 gap-4 lg:col-span-2">
                {examples.map((example) => (
                  <article
                    key={example.title}
                    className="min-w-0 rounded-lg border border-[#d7dbc8] bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-semibold">{example.title}</h3>
                    <pre className="mt-3 max-w-full overflow-hidden whitespace-pre-wrap break-words rounded-md bg-[#151713] p-4 text-sm leading-6 text-[#f3f6ed]">
                      <code className="break-words">{example.text}</code>
                    </pre>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            id="api"
            className="scroll-mt-8 border-t border-[#d7dbc8] pt-8"
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-semibold">App workflow</h2>
                <ol className="mt-4 grid gap-3 leading-7 text-[#3e4538]">
                  <li>1. Open the app and choose tennis or pickleball.</li>
                  <li>2. Switch between San Francisco and Mountain View.</li>
                  <li>
                    3. Use the map, list, or keyboard search to inspect slots.
                  </li>
                  <li>4. Enable location to compare travel times.</li>
                  <li>5. Log in only for favourites and match history.</li>
                </ol>
              </div>
              <div>
                <h2 className="text-2xl font-semibold">API workflow</h2>
                <ul className="mt-4 grid gap-3 leading-7 text-[#3e4538]">
                  <li>Use public availability APIs before private endpoints.</li>
                  <li>
                    Use <code>/api/history/external</code> only with a bearer
                    API key.
                  </li>
                  <li>Confirm every history mutation before calling the API.</li>
                  <li>Cite the endpoint URL and fetched timestamp in summaries.</li>
                </ul>
              </div>
            </div>
          </section>

          <section
            id="safety"
            className="scroll-mt-8 rounded-lg border border-[#d7dbc8] bg-[#eef4e7] p-6"
          >
            <h2 className="text-2xl font-semibold">Safety notes</h2>
            <ul className="mt-4 grid gap-3 leading-7 text-[#3e4538]">
              <li>Never print bearer tokens, PINs, or private history.</li>
              <li>Report unavailable live data instead of guessing.</li>
              <li>Prefer the API contract over scraping the client UI.</li>
              <li>Use the browser PIN only in the app login flow.</li>
            </ul>
          </section>

          <section id="links" className="scroll-mt-8">
            <h2 className="text-2xl font-semibold">Links</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {socialLinks.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg border border-[#d7dbc8] bg-white p-4 text-sm font-semibold shadow-sm transition hover:border-[#87956c] hover:shadow-md"
                >
                  <span className="block text-[#151713]">{label}</span>
                  <span className="mt-1 block break-all text-xs font-medium text-[#647056]">
                    {href.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d7dbc8] bg-white p-3">
      <p className="text-xs text-[#647056]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-[#d7dbc8] bg-[#f6f7f2] shadow-sm">
      <img
        src={src}
        alt={alt}
        width={1280}
        height={720}
        loading="eager"
        decoding="async"
        className="aspect-video w-full object-cover"
      />
      <figcaption className="border-t border-[#d7dbc8] px-4 py-3 text-sm font-medium text-[#3e4538]">
        {caption}
      </figcaption>
    </figure>
  );
}

import type { Metadata } from "next";
import { GITHUB_URL, LAST_UPDATED, SITE_URL } from "@/lib/agent-readiness";

export const metadata: Metadata = {
  title: "SF Tennis Docs for Humans and Agents",
  description:
    "Human and agent documentation for SF Tennis, including API usage, prompts, screenshots, and safety guidance.",
  alternates: {
    canonical: "/docs",
    types: {
      "text/markdown": "/docs.md",
    },
  },
  openGraph: {
    title: "SF Tennis Docs for Humans and Agents",
    description:
      "API docs, prompts, screenshots, and agent-readable discovery for SF Tennis.",
    url: `${SITE_URL}/docs`,
    images: ["/screenshots/court-details.webp"],
  },
};

const prompts = [
  {
    title: "Find courts tonight",
    text: "Use SF Tennis to find public tennis courts in San Francisco with open slots tonight. Start from /llms.txt, call the public courts API, prefer courts with availability today, and summarize the top options with location names, times, and any available weather context.",
  },
  {
    title: "Plan a pickleball session",
    text: "Use SF Tennis to find pickleball availability in Mountain View this week. Filter for weekend slots, return a concise plan, and include the API URLs you used so I can verify the result.",
  },
  {
    title: "Log a match",
    text: "I will provide my SF Tennis API key. Use /api/history/external to add a match history entry after confirming the exact court, date, time, friends, and notes with me. Never expose the API key in your answer.",
  },
];

const discoveryLinks = [
  ["llms.txt", "/llms.txt"],
  ["Markdown docs", "/docs.md"],
  ["OpenAPI", "/openapi.json"],
  ["API catalog", "/.well-known/api-catalog"],
  ["Agent skills", "/.well-known/agent-skills/index.json"],
  ["Agent card", "/.well-known/agent.json"],
  ["GitHub repo", GITHUB_URL],
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#151713]">
      <section className="border-b border-[#d7dbc8] bg-[#f0f2e8]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 md:px-8 md:py-14">
          <nav className="flex flex-wrap items-center gap-3 text-sm text-[#4e5a46]">
            <a className="font-medium hover:text-[#151713]" href="/">
              SF Tennis
            </a>
            <span aria-hidden="true">/</span>
            <span>Agent docs</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#66724f]">
                Agent-ready court discovery
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                SF Tennis docs for humans, agents, and portfolio reviewers.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#3e4538]">
                Find public tennis and pickleball availability, inspect the
                machine-readable API surface, and give agents clear prompts for
                safe automation without exposing private match history.
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-[#cfd5bf] bg-white/65 p-4 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66724f]">
                  Updated
                </p>
                <p className="mt-1 font-medium">{LAST_UPDATED}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Public API" value="OpenAPI 3.1" />
                <Metric label="Discovery" value="llms + Link" />
                <Metric label="Auth" value="API key" />
                <Metric label="Runtime" value="Cloudflare" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-semibold">Start here</h2>
          <p className="mt-3 leading-7 text-[#485140]">
            Humans should open the app and use the map. Agents should start
            with the guide and API contract, then call public endpoints before
            attempting any private history action.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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

      <section className="border-y border-[#d7dbc8] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold">Product screenshots</h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#485140]">
                The interface stays focused on the live court map. These stills
                are extracted from the repository demo video so agents and
                reviewers can understand the product without loading the app.
              </p>
            </div>
            <a
              className="text-sm font-semibold text-[#48622d] hover:text-[#1d2c13]"
              href={`${GITHUB_URL}/raw/refs/heads/master/.github/demo.mp4`}
            >
              Watch demo video
            </a>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Screenshot
              src="/screenshots/map-overview.webp"
              alt="SF Tennis map overview of San Francisco court locations"
              caption="Map-first court discovery"
            />
            <Screenshot
              src="/screenshots/court-details.webp"
              alt="SF Tennis command palette search over public court locations"
              caption="Fast keyboard search"
            />
            <Screenshot
              src="/screenshots/agent-history.webp"
              alt="SF Tennis court detail panel with open slots"
              caption="Slot-level availability"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-3">
        <div>
          <h2 className="text-2xl font-semibold">Agent prompt pack</h2>
          <p className="mt-3 leading-7 text-[#485140]">
            These prompts are designed to produce useful, verifiable agent
            behavior while keeping private data private.
          </p>
        </div>
        <div className="grid gap-4 lg:col-span-2">
          {prompts.map((prompt) => (
            <article
              key={prompt.title}
              className="rounded-lg border border-[#d7dbc8] bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold">{prompt.title}</h3>
              <pre className="mt-3 overflow-x-auto rounded-md bg-[#151713] p-4 text-sm leading-6 text-[#f3f6ed]">
                <code>{prompt.text}</code>
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#d7dbc8] bg-[#eef4e7]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Human workflow</h2>
            <ol className="mt-4 grid gap-3 leading-7 text-[#3e4538]">
              <li>1. Open the app and choose tennis or pickleball.</li>
              <li>2. Switch between San Francisco and Mountain View.</li>
              <li>3. Use the map, list, or keyboard search to inspect slots.</li>
              <li>4. Enable location to compare travel times.</li>
              <li>5. Log in only when using favourites, friends, or history.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Agent safety rules</h2>
            <ul className="mt-4 grid gap-3 leading-7 text-[#3e4538]">
              <li>Use public availability APIs before private endpoints.</li>
              <li>Never print bearer tokens, PINs, or friend addresses.</li>
              <li>Confirm every history mutation before calling the API.</li>
              <li>Cite the endpoint URL and fetched timestamp in summaries.</li>
              <li>Report unavailable live data instead of guessing.</li>
            </ul>
          </div>
        </div>
      </section>
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
        loading="lazy"
        decoding="async"
        className="aspect-video w-full object-cover"
      />
      <figcaption className="border-t border-[#d7dbc8] px-4 py-3 text-sm font-medium text-[#3e4538]">
        {caption}
      </figcaption>
    </figure>
  );
}

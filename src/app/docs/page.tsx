import type { Metadata } from "next";
import { DocsImagePreview } from "@/components/DocsImagePreview";
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

const sidebarGroups = [
  {
    title: "Get started",
    links: [
      ["Overview", "#overview"],
      ["Product screenshots", "#screenshots"],
      ["Example requests", "#examples"],
    ],
  },
  {
    title: "API reference",
    links: [
      ["Availability", "#availability-api"],
      ["History", "#history-api"],
      ["Discovery files", "#discovery"],
    ],
  },
  {
    title: "Operations",
    links: [
      ["Safety notes", "#safety"],
      ["Resources", "#resources"],
    ],
  },
];

const screenshots = [
  {
    src: "/screenshots/map-overview.webp",
    alt: "SF Tennis map overview of San Francisco court locations",
    caption: "Map-first discovery",
    description: "Court status, location, and availability at a glance.",
  },
  {
    src: "/screenshots/court-details.webp",
    alt: "SF Tennis court detail panel with live slot availability",
    caption: "Court details",
    description: "Slot-level availability, court counts, and booking links.",
  },
  {
    src: "/screenshots/keyboard-search.webp",
    alt: "SF Tennis keyboard search over public court locations",
    caption: "Keyboard search",
    description: "Fast filtering for courts, sports, cities, and time windows.",
  },
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
  {
    label: "Integration guide",
    href: "/llms.txt",
    description: "Compact text guide for API workflows.",
  },
  {
    label: "Markdown docs",
    href: "/docs.md",
    description: "Plain Markdown mirror of this documentation.",
  },
  {
    label: "OpenAPI",
    href: "/openapi.json",
    description: "Machine-readable contract for availability and history APIs.",
  },
  {
    label: "API catalog",
    href: "/.well-known/api-catalog",
    description: "Linkset discovery for public API resources.",
  },
  {
    label: "OAuth metadata",
    href: "/.well-known/oauth-authorization-server",
    description: "OAuth-compatible authorization server metadata.",
  },
  {
    label: "Protected resource",
    href: "/.well-known/oauth-protected-resource",
    description: "Protected resource metadata for the history API.",
  },
  {
    label: "GitHub repository",
    href: GITHUB_URL,
    description: "Source code, deployment config, and schema.",
  },
];

const endpointGroups = [
  {
    id: "availability-api",
    title: "Availability API",
    description:
      "Read-only endpoints for live court inventory, slot availability, and travel estimates.",
    endpoints: [
      ["GET", "/api/courts?sport=tennis&city=sf", "Court availability by sport and city."],
      ["GET", "/api/directions", "Walking and driving estimates for up to 50 locations."],
      ["GET", "/api/health", "Basic service health check."],
    ],
  },
  {
    id: "history-api",
    title: "History API",
    description:
      "Bearer-token endpoints for private match history. Use only after explicit user authorization.",
    endpoints: [
      ["GET", "/api/history/external", "List match history and the public courts API hint."],
      ["POST", "/api/history/external", "Create a match history entry."],
      ["PUT", "/api/history/external", "Update a match history entry."],
      ["DELETE", "/api/history/external", "Delete a match history entry."],
    ],
  },
];

const socialLinks = [
  { label: "Project page", href: PROJECT_URL, icon: "project" },
  { label: "Website", href: MARVIN_URL, icon: "website" },
  { label: "GitHub", href: GITHUB_PROFILE_URL, icon: "github" },
  { label: "X", href: X_URL, icon: "x" },
  { label: "LinkedIn", href: LINKEDIN_URL, icon: "linkedin" },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <MobileHeader />
      <Sidebar />

      <div className="lg:pl-72">
        <article className="max-w-5xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          <header id="overview" className="scroll-mt-24">
            <p className="text-sm font-medium text-emerald-700">
              Documentation
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              SF Tennis
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Live public tennis and pickleball availability for San Francisco
              and Mountain View, with a compact API surface for availability and
              match history workflows.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>Updated {LAST_UPDATED}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              <span>Cloudflare Workers</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              <span>OpenAPI 3.1</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium">
              <TextLink href="/">Open app</TextLink>
              <TextLink href="/openapi.json">View OpenAPI</TextLink>
              <TextLink href={PROJECT_URL}>Project page</TextLink>
            </div>
          </header>

          <Section
            id="screenshots"
            eyebrow="Product"
            title="Screenshots"
            description="Click any screenshot to open a larger preview. The current set was captured from the running product with Playwright."
          >
            <DocsImagePreview images={screenshots} />
          </Section>

          <Section
            id="examples"
            eyebrow="Guides"
            title="Example requests"
            description="Short requests that map cleanly to the API and keep private history protected."
          >
            <div className="space-y-5">
              {examples.map((example) => (
                <RequestExample key={example.title} {...example} />
              ))}
            </div>
          </Section>

          <Section
            id="api"
            eyebrow="Reference"
            title="API"
            description="Use public endpoints for availability. Use the protected history endpoint only with a bearer API key."
          >
            <div className="space-y-10">
              {endpointGroups.map((group) => (
                <EndpointGroup key={group.id} {...group} />
              ))}
            </div>
          </Section>

          <Section
            id="discovery"
            eyebrow="Reference"
            title="Discovery files"
            description="These URLs are intentionally plain links so they stay easy to scan, copy, and inspect."
          >
            <ResourceList items={discoveryLinks} />
          </Section>

          <Section
            id="safety"
            eyebrow="Operations"
            title="Safety notes"
            description="The public availability API is safe to call without credentials. Treat browser sessions and history API keys as private."
          >
            <ul className="space-y-3 text-sm leading-7 text-slate-600">
              <li>Never print bearer tokens, PINs, or private history.</li>
              <li>Report unavailable live data instead of guessing.</li>
              <li>Prefer the API contract over scraping the client UI.</li>
              <li>Use the browser PIN only in the app login flow.</li>
            </ul>
          </Section>

          <Section
            id="resources"
            eyebrow="Resources"
            title="Links"
            description="Project, profile, and social links for Marvin Aziz."
          >
            <SocialLinks />
          </Section>
        </article>
      </div>
    </main>
  );
}

function MobileHeader() {
  const links = sidebarGroups.flatMap((group) => group.links);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <a href="/" className="text-sm font-semibold text-slate-950">
          SF Tennis
        </a>
        <a href="/openapi.json" className="text-sm font-medium text-emerald-700">
          OpenAPI
        </a>
      </div>
      <nav
        aria-label="Documentation sections"
        className="mt-3 flex gap-4 overflow-x-auto pb-1 text-sm text-slate-600"
      >
        {links.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 transition hover:text-slate-950"
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-200 px-6 py-5">
        <a href="/" className="block text-base font-semibold text-slate-950">
          SF Tennis
        </a>
        <p className="mt-1 text-sm text-slate-500">Documentation</p>
      </div>

      <nav
        aria-label="Documentation sections"
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        <div className="space-y-8">
          {sidebarGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.links.map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className="block rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          Updated
        </p>
        <p className="mt-1 text-sm text-slate-600">{LAST_UPDATED}</p>
        <div className="mt-4 flex items-center gap-3">
          <IconOnlyLink href={GITHUB_PROFILE_URL} label="GitHub" icon="github" />
          <IconOnlyLink href={X_URL} label="X" icon="x" />
          <IconOnlyLink href={LINKEDIN_URL} label="LinkedIn" icon="linkedin" />
        </div>
      </div>
    </aside>
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-200 py-12">
      <div className="mb-7">
        <p className="text-sm font-medium text-emerald-700">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function RequestExample({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <pre className="mt-3 max-w-full overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-100 shadow-sm">
        <code className="break-words">{text}</code>
      </pre>
    </article>
  );
}

function EndpointGroup({
  id,
  title,
  description,
  endpoints,
}: {
  id: string;
  title: string;
  description: string;
  endpoints: string[][];
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        {endpoints.map(([method, path, summary]) => (
          <div key={`${method}-${path}`} className="grid gap-2 py-4 sm:grid-cols-[92px_1fr]">
            <span className="w-fit rounded-md bg-emerald-50 px-2 py-1 font-mono text-xs font-semibold text-emerald-700">
              {method}
            </span>
            <div>
              <code className="text-sm font-semibold text-slate-950">
                {path}
              </code>
              <p className="mt-1 text-sm leading-6 text-slate-600">{summary}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResourceList({
  items,
}: {
  items: Array<{ label: string; href: string; description: string }>;
}) {
  return (
    <ul className="divide-y divide-slate-200 border-y border-slate-200">
      {items.map((item) => (
        <li key={item.href} className="py-4">
          <a
            href={item.href}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-emerald-700"
          >
            {item.label}
            <ArrowIcon />
          </a>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-slate-500">
            {item.href}
          </p>
        </li>
      ))}
    </ul>
  );
}

function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-4">
      {socialLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-emerald-700"
        >
          <BrandIcon icon={link.icon} className="h-5 w-5" />
          {link.label}
        </a>
      ))}
    </div>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-emerald-700 transition hover:text-emerald-900"
    >
      {children}
      <ArrowIcon />
    </a>
  );
}

function IconOnlyLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="text-slate-500 transition hover:text-emerald-700"
    >
      <BrandIcon icon={icon} className="h-5 w-5" />
    </a>
  );
}

function BrandIcon({ icon, className }: { icon: string; className: string }) {
  if (icon === "github") return <GitHubIcon className={className} />;
  if (icon === "x") return <XIcon className={className} />;
  if (icon === "linkedin") return <LinkedInIcon className={className} />;
  if (icon === "project") return <ProjectIcon className={className} />;
  return <WebsiteIcon className={className} />;
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M12.293 4.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L15.586 11H2a1 1 0 1 1 0-2h13.586l-3.293-3.293a1 1 0 0 1 0-1.414Z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function XIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

function WebsiteIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8M12 3c2 2.4 3 5.4 3 9s-1 6.6-3 9c-2-2.4-3-5.4-3-9s1-6.6 3-9Z" />
    </svg>
  );
}

function ProjectIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z" />
      <path d="M7 8h10M7 12h5M7 16h7" />
    </svg>
  );
}

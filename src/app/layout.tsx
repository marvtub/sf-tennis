import type { Metadata } from "next";
import { GITHUB_URL, SITE_URL } from "@/lib/agent-readiness";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "SF Tennis",
  title: {
    default: "SF Tennis - Live Public Court Availability",
    template: "%s | SF Tennis",
  },
  description:
    "Find live public tennis and pickleball court availability in San Francisco and Mountain View, with travel times and API docs.",
  keywords: [
    "San Francisco tennis courts",
    "pickleball courts",
    "court availability",
    "SF Tennis API",
  ],
  authors: [{ name: "Marvin Aziz", url: "https://marvinaziz.de" }],
  creator: "Marvin Aziz",
  publisher: "Marvin Aziz",
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": "/llms.txt",
      "application/vnd.oai.openapi+json": "/openapi.json",
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "SF Tennis",
    title: "SF Tennis - Live Public Court Availability",
    description:
      "Real-time tennis and pickleball court availability with travel times and API docs.",
    images: [
      {
        url: "/screenshots/court-details.webp",
        width: 1280,
        height: 720,
        alt: "SF Tennis court detail screenshot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SF Tennis - Live Public Court Availability",
    description:
      "Real-time tennis and pickleball court availability with API docs.",
    images: ["/screenshots/court-details.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SF Tennis",
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  codeRepository: GITHUB_URL,
  author: {
    "@type": "Person",
    name: "Marvin Aziz",
    url: "https://marvinaziz.de",
  },
  description:
    "Real-time public tennis and pickleball court availability for San Francisco and Mountain View.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to hot APIs to save ~100ms on TLS handshake */}
        <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.rec.us" crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="help" href="/docs" />
        <link rel="alternate" type="text/markdown" href="/llms.txt" />
        <link
          rel="service-desc"
          type="application/vnd.oai.openapi+json"
          href="/openapi.json"
        />
        <link
          rel="api-catalog"
          type="application/linkset+json"
          href="/.well-known/api-catalog"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

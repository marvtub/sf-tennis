import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SF Tennis Courts",
  description: "Find available tennis courts in San Francisco",
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
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

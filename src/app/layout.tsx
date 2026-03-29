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
      <body className="antialiased">{children}</body>
    </html>
  );
}

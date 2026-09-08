import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // No next/image optimization (not supported on CF Workers)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

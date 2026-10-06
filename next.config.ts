import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md is the agent guide for this repo; don't let `next dev` write its own.
  agentRules: false,
  images: {
    // DeoVR's CDN already serves right-sized covers; don't spend optimizer quota re-encoding them.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "cdn-vr.deovr.com", pathname: "/**" }],
  },
  // The directions gallery is static HTML in public/directions.
  async rewrites() {
    return [{ source: "/directions", destination: "/directions/index.html" }];
  },
};

export default nextConfig;

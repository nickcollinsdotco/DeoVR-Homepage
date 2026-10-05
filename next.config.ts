import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn-vr.deovr.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

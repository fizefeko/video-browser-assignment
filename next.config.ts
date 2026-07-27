import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every thumbnail in the dataset is served from this host.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/XiteTV/**",
      },
    ],
  },
};

export default nextConfig;

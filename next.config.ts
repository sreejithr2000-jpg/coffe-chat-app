import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typedRoutes disabled — causes false positives when new pages are added
  // during active development (re-enable once route set is stable)
};

export default nextConfig;

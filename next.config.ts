import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to use standard webpack (better Tailwind v3 compatibility)
  // Remove this if you want to use Turbopack with Tailwind v4
  // Turbopack is disabled by default for builds, but explicitly setting it here
  // to avoid font loading issues
};

export default nextConfig;

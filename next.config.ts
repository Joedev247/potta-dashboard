import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to use standard webpack (better Tailwind v3 compatibility)
  // Remove this if you want to use Turbopack with Tailwind v4
};

export default nextConfig;

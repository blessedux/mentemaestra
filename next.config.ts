import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Prefer this app's lockfile over parent workspace lockfiles.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Content markdown files are in /content at project root
  reactCompiler: true,
  output: "standalone",
};

export default nextConfig;

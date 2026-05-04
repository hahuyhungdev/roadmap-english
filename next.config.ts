import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Content markdown files are in /content at project root
  reactCompiler: true,
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/phase/phase-2-the-strategic-psychological-engine/session/:path*",
        destination:
          "/phase/phase-3-the-strategic-psychological-engine/session/:path*",
        permanent: false,
      },
      {
        source: "/phase/phase-2-the-strategic-psychological-engine",
        destination: "/phase/phase-3-the-strategic-psychological-engine",
        permanent: false,
      },
      {
        source: "/phase/phase-3-practical-discussion/session/:path*",
        destination:
          "/phase/phase-3-the-strategic-psychological-engine/session/:path*",
        permanent: false,
      },
      {
        source: "/phase/phase-3-practical-discussion",
        destination: "/phase/phase-3-the-strategic-psychological-engine",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// React Compiler adds a Babel transform pass to every file, which is
// noticeably heavier in dev mode. On low-memory machines this can be
// the difference between a snappy dev server and one that swaps to
// disk constantly. We keep it enabled for production builds (where
// the performance benefit matters and the extra compile time is a
// one-off cost), but skip it during `next dev`.
const nextConfig: NextConfig = {
  reactCompiler: process.env.NODE_ENV === "production",
};

export default nextConfig;

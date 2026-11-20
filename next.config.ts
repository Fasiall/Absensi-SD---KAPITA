import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Izinkan akses dev dari perangkat lain di jaringan lokal (uji di HP).
  allowedDevOrigins: ["192.168.1.15", "192.168.*.*", "10.0.0.*", "localhost"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

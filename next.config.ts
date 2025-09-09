import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(process.cwd(), "app", "styles")],
    prependData: `@use "./base" as *;`,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google avatars
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com", // flag fallback
      },
    ],
  },
};

export default nextConfig;
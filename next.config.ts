import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(process.cwd(), "app", "styles")], // or remove this line entirely
    prependData: `@use "./base" as *;`,
  },
};

export default nextConfig;
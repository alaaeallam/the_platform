import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [
      path.join(process.cwd(), "app"),          // 👈 so "styles" resolves to app/styles
      path.join(process.cwd(), "app", "components"),
      path.join(process.cwd(), "app", "styles"),
    ],
     prependData: `@use "styles/base" as *;`,
  },
  images: {
    remotePatterns: [
     // Google avatars (if you use Google auth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Cloudinary (your default avatar)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // AliExpress / AliCDN offer images
      { protocol: "https", hostname: "ae01.alicdn.com" },
      { protocol: "https", hostname: "img.alicdn.com" },
      { protocol: "https", hostname: "gdp.alicdn.com" },
      { protocol: "https", hostname: "assets.stickpng.com" },
      { protocol: "https", hostname: "img.ltwebstatic.com" },
      { protocol: 'https', hostname: 'www.pngmart.com' },
      { protocol: 'https', hostname: 'www.freeiconspng.com' },
    ],
  },
};

export default nextConfig;
// app/layout.tsx (server component)
import type { Metadata } from "next";
import { headers } from "next/headers"; // ✅ read Vercel geo headers
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.scss";
import { Providers } from "./providers";
import Header from "@/components/header";
import Footer from "@/components/footer";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// your countries util
import { COUNTRY_MAP, type CountryInfo } from "@/utils/countries";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Silhouett Sunglasses & Eyewear Store",
  description: "Shop the latest sunglasses and eyewear at Silhouett.",
};

// ✅ Use Vercel Geo header only (no external API)
async function getCountry(): Promise<CountryInfo> {
  const h = await headers();
  const code = h.get("x-vercel-ip-country") || "US"; // e.g. "EG", "US"
  return COUNTRY_MAP[code] ?? { code, name: "Unknown", flag: "🏳️" };
}

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const [country, session] = await Promise.all([
    getCountry(),
    getServerSession(authOptions),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <Providers session={session}>
          <Header country={country} />
          {children}
          <Footer country={country} />
        </Providers>
      </body>
    </html>
  );
}
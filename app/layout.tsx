// app/layout.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.scss";
import { Providers } from "./providers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCountryFromCode, type CountryInfo } from "@/utils/countries";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Silhouett Sunglasses & Eyewear Store",
  description: "Shop the latest sunglasses and eyewear at Silhouett.",
};

// your existing Header/Footer prop shape
type LegacyCountry = { name: string; code: string; flag: string };

// --- Fix here: headers() is sync; add a tiny shim for `.get()` ---
type H = { get(name: string): string | null };

function getCountry(): CountryInfo {
  const h = headers() as unknown as H; // ✅ no await, expose `.get()`
  const code =
    h.get("x-vercel-ip-country") ||   // e.g. "EG"
    process.env.GEO_OVERRIDE ||       // handy for local testing
    "US";

  return getCountryFromCode(code);
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
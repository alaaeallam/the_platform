// app/layout.tsx (server component)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.scss";
import { Providers } from "./providers";
import Header from "@/components/header";
import Footer from "@/components/footer";

import { getServerSession } from "next-auth";        // ✅ v4 server helper
import { authOptions } from "@/lib/auth";            // your NextAuth options

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Silhouett Sunglasses & Eyewear Store",
  description: "Shop the latest sunglasses and eyewear at Silhouett.",
};

type Country = { name: string; flag: string; code: string };

async function getCountry(): Promise<Country> {
  try {
    const res = await fetch("https://api.ipregistry.co/?key=dwr1bs7weh4ixl9z", {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("ipregistry failed");
    const data = await res.json();
    const c = data?.location?.country;
    return {
      name: c?.name ?? "Unknown",
      flag: c?.flag?.emojitwo ?? "",
      code: c?.code ?? "US",
    };
  } catch {
    return {
      name: "US",
      flag: "https://cdn-icons-png.flaticon.com/512/197/197484.png",
      code: "US",
    };
  }
}

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const [country, session] = await Promise.all([
    getCountry(),
    getServerSession(authOptions),                // ✅ v4 way
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <Providers>
          <Header country={country} />
          {/* test output (remove later) */}
          <div style={{ display: "none" }} aria-hidden>
            {session ? "you are logged in" : "you are not logged in"}
          </div>
          {children}
          <Footer country={country} />
        </Providers>
      </body>
    </html>
  );
}
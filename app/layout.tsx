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
import HideChrome from "./_chrome/HideChrome"; 
// <-- add this import

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Silhouett Sunglasses & Eyewear Store",
  description: "Shop the latest sunglasses and eyewear at Silhouett.",
};

async function getCountry(): Promise<CountryInfo> {
  try {
    const h = await headers();
    const code = h.get("x-vercel-ip-country") || process.env.GEO_OVERRIDE || "US";
    return getCountryFromCode(code);
  } catch {
    return getCountryFromCode("US");
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [country, session] = await Promise.all([
    getCountry(),
    getServerSession(authOptions),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var p = location.pathname;
    if (/^\\/cart(\\/|$)/.test(p) || /^\\/shop\\/cart(\\/|$)/.test(p)) {
      document.documentElement.classList.add('hide-chrome');
    }
  } catch(e) {}
})();`,
          }}
        />
        <Providers session={session}>
          {/* Hide global Header/Footer on /shop/cart */}
          <HideChrome hideOn={["/shop/cart"]}>
            <div className="global-chrome">
              <Header country={country} />
            </div>
          </HideChrome>

          {children}

          <HideChrome hideOn={["/shop/cart"]}>
            <div className="global-chrome">
              <Footer country={country} />
            </div>
          </HideChrome>
        </Providers>
      </body>
    </html>
  );
}
// app/(shop)/layout.tsx
export const dynamic = "force-dynamic";

import { cookies, headers } from "next/headers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCountryFromCode, type CountryInfo } from "@/utils/countries";
import CrossTabCartSync from "@/components/cart/CrossTabCartSync";
import AppProviders from "@/components/providers/AppProviders";

async function getCountry(): Promise<CountryInfo> {
  try {
    const cookieStore = await cookies();
    const cookieCode = String(cookieStore.get("country")?.value || "")
      .trim()
      .toUpperCase();

    if (/^[A-Z]{2}$/.test(cookieCode)) {
      return getCountryFromCode(cookieCode);
    }

    const h = await headers();
    const headerCode = String(
      h.get("x-country") ||
      h.get("x-vercel-ip-country") ||
      h.get("cf-ipcountry") ||
      process.env.GEO_OVERRIDE ||
      "US"
    )
      .trim()
      .toUpperCase();

    return getCountryFromCode(headerCode);
  } catch {
    return getCountryFromCode("US");
  }
}

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const country = await getCountry();

  return (
    <AppProviders>
      <CrossTabCartSync />
      <Header country={country} />
      {children}
      <Footer country={country} />
    </AppProviders>
  );
}
// app/(shop)/layout.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCountryFromCode, type CountryInfo } from "@/utils/countries";
import CrossTabCartSync from "@/components/cart/CrossTabCartSync";
import AppProviders from "@/components/providers/AppProviders";

async function getCountry(): Promise<CountryInfo> {
  try {
    const h = await headers();

    const code = (
      h.get("x-vercel-ip-country") ||
      h.get("cf-ipcountry") ||
      process.env.GEO_OVERRIDE ||
      "US"
    ).toUpperCase();

    return getCountryFromCode(code);
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
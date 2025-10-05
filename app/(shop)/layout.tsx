// app/(shop)/layout.tsx
import { headers } from "next/headers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCountryFromCode, type CountryInfo } from "@/utils/countries";
import { Toaster } from "react-hot-toast";
import CrossTabCartSync from "@/components/cart/CrossTabCartSync";

async function getCountry(): Promise<CountryInfo> {
  try {
    const h = await headers();
    const code = h.get("x-vercel-ip-country") || process.env.GEO_OVERRIDE || "US";
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
    <>
      <CrossTabCartSync />
      <Header country={country} />
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Footer country={country} />
    </>
  );
}
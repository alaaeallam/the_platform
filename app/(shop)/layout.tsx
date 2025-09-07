// app/(shop)/layout.tsx
import type { ReactNode } from "react";
import axios from "axios";
import Header from "@/components/header";
import Footer from "@/components/footer";

type Country = { name: string; flag: string };

async function getCountry(): Promise<Country> {
  try {
    const res = await axios.get("https://api.ipregistry.co/?key=dwr1bs7weh4ixl9z");
    const c = res.data?.location?.country;
    return {
      name: c?.name ?? "Unknown",
      flag: c?.flag?.emojitwo ?? "", // may be emoji or URL depending on plan
    };
  } catch {
    return {
      name: "Morocco",
      flag: "https://cdn-icons-png.flaticon.com/512/197/197551.png?w=360",
    };
  }
}

export default async function Layout({ children }: { children: ReactNode }) {
  const country = await getCountry(); // runs on the server
  return (
    <div>
      {/* Pass country down to Header */}
      <Header country={country} />
      {children}
      <Footer />
    </div>
  );
}
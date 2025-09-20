// app/layout.tsx
import type { Metadata } from "next";
import "./styles/globals.scss";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Silhouett Sunglasses & Eyewear Store",
  description: "Shop the latest sunglasses and eyewear at Silhouett.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers session={null}>{children}</Providers>
      </body>
    </html>
  );
}
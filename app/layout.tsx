// app/layout.tsx
import type { Metadata } from "next";
import "./styles/globals.scss";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Berwaz By Rania Maged",
  description: "Wall art paintings and prints, painting on clothes, bags and shoes, piñata for parties, wedding caricature and much more by Rania Maged, adds a decorative touch to your house making it elegant and stylish. Please, message us for orders or inquiries.",
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
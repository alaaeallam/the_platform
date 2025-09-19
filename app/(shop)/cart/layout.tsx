// app/(shop)/cart/layout.tsx
import type { ReactNode } from "react";
import Header from "@/components/cart/header";

export default function CartLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
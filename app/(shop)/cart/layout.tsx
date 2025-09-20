// app/cart/layout.tsx
import type { ReactNode } from "react";


export default function CartLayout({ children }: { children: ReactNode }) {
  return (
    <>
      
      <main>{children}</main>
    </>
  );
}
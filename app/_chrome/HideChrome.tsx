// app/_chrome/HideChrome.tsx
"use client";
import { usePathname } from "next/navigation";

export default function HideChrome({
  children,
  hideOn = [/^\/cart(\/|$)/, /^\/shop\/cart(\/|$)/],
}: {
  children: React.ReactNode;
  hideOn?: (string | RegExp)[];
}) {
  const pathname = usePathname() || "/";
  const shouldHide = hideOn.some((rule) =>
    typeof rule === "string"
      ? pathname === rule || pathname.startsWith(rule)
      : rule.test(pathname)
  );
  if (shouldHide) return null;
  return <>{children}</>;
}
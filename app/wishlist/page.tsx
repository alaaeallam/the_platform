// app/wishlist/page.tsx
import WishlistClient from "@/components/wishlist/WishlistClient";

export const dynamic = "force-dynamic";
export default function Page() {
  return <WishlistClient />;
}
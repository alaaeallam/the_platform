// components/wishlist/WishlistClient.tsx
"use client";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWishlist, toggleWishlist } from "@/store/wishlistSlice";

export default function WishlistClient() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((s) => s.wishlist);

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!items.length) return <div style={{ padding: 24 }}>Your wishlist is empty.</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {items.map((it) => (
        <div key={it.key} style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.image} alt={it.name} width={64} height={64} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{it.name}</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              {it.size ? `Size: ${it.size} • ` : ""}{it.color ? `Color: ${it.color}` : ""}
            </div>
          </div>
          <button onClick={() => dispatch(toggleWishlist(it))}>Remove</button>
          {/* Optional: Move to cart button in later step */}
        </div>
      ))}
    </div>
  );
}
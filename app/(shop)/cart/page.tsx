// app/(shop)/cart/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

import CartHeader from "@/components/cart/cartHeader";
import Product from "@/components/cart/product";
import Checkout from "@/components/cart/checkout";
import PaymentMethods from "@/components/cart/paymentMethods";
import ProductsSwiper from "@/components/productsSwiper";
import Empty from "@/components/cart/empty";
import { women_swiper } from "@/data/home";

import { saveCart, type CartPayload } from "@/requests/user";
import { syncCart, type CartSyncResponse } from "@/requests/cart";
import type { CartProduct } from "@/types/cart";

import styles from "@/app/styles/cart.module.scss";

interface CartState { cartItems: CartProduct[] }
interface RootState { cart: CartState }

/** Parse productId & style index from legacy _uid = `${productId}_${styleIndex}_${sizeIndex}` */
function parseIdsFromUid(uid: string): { productId?: string; style?: number } {
  const [productId, styleStr] = String(uid || "").split("_");
  const style = Number(styleStr);
  return {
    productId: productId && productId.length >= 12 ? productId : undefined,
    style: Number.isFinite(style) ? style : undefined,
  };
}

// 👉 put your real mapping here:
const COUNTRY_GROUPS: Record<string, string[]> = {
  LOW_ECONOMY: ["EG", "PK", "BD", "IN", "MA", "TN"],
  // MENA: ["EG","SA","AE","..."], etc
};

export default function CartPage(): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();

  const { cart } = useSelector((state: RootState) => state);
  const [selected, setSelected] = useState<CartProduct[]>([]);

  // server-synced snapshot (prices/qty/shipping)
  const [synced, setSynced] = useState<CartSyncResponse | null>(null);

  // choose the shopper country (hard-code for now or read from profile/IP)
  const COUNTRY = "EG"; // ← change to whatever you detect for the user

  // keep selection in sync with cart contents
  useEffect(() => {
    const items = cart?.cartItems ?? [];
    if (!items.length) {
      setSelected([]);
      setSynced(null);
      return;
    }
    setSelected((prev) => {
      if (!prev.length) return items; // select all initially
      const prevIds = new Set(prev.map((p) => p._uid));
      const merged = [...prev];
      for (const it of items) if (!prevIds.has(it._uid)) merged.push(it);
      return merged.filter((p) => items.some((c) => c._uid === p._uid));
    });
  }, [cart?.cartItems]);

  // CALL /api/cart/sync whenever selection changes (and on mount)
  useEffect(() => {
    if (!selected.length) {
      setSynced(null);
      return;
    }
    (async () => {
      try {
        const payload = {
          cart: selected.map((line) => {
            const ids = parseIdsFromUid(line._uid);
            if (!ids.productId || typeof ids.style !== "number" || !line.size) return undefined;
            return {
              productId: ids.productId,
              style: ids.style,
              size: String(line.size),
              qty: Number(line.qty || 1),
              _uid: line._uid,
            };
          }).filter(Boolean) as { productId: string; style: number; size: string; qty: number; _uid?: string }[],
          country: COUNTRY,
          countryGroups: COUNTRY_GROUPS,
        };
        const res = await syncCart(payload);
        setSynced(res);
      } catch (e) {
        console.error("cart sync failed:", e);
        setSynced(null);
      }
    })();
  }, [selected]);

  // (optional) auto-refresh every 60s while on the page
  useEffect(() => {
    if (!selected.length) return;
    const t = setInterval(() => {
      // re-run the effect by touching selected (or extract to a function and call it)
      setSelected((s) => [...s]);
    }, 60_000);
    return () => clearInterval(t);
  }, [selected.length]);

  // Order Summary uses server totals when available; fallback to client calc
  const { shippingFee, subtotal, total } = useMemo(() => {
    if (synced) {
      return {
        shippingFee: synced.shipping,
        subtotal: synced.subtotal,
        total: synced.total,
      };
    }
    const shipping = selected.reduce((a, c) => a + Number(c.shipping ?? 0), 0);
    const sub = selected.reduce((a, c) => a + Number(c.price) * Number(c.qty), 0);
    return {
      shippingFee: Number(shipping.toFixed(2)),
      subtotal: Number(sub.toFixed(2)),
      total: Number((sub + shipping).toFixed(2)),
    };
  }, [synced, selected]);

  // Save to DB using the SYNCED lines, then go to checkout
  const saveCartToDbHandler = async (): Promise<void> => {
    if (!selected.length) return;
    if (!session) return void signIn();

    const payload: CartPayload = synced
      ? {
          cart: synced.lines.map((l) => ({
            productId: l.productId,
            style: l.style,
            size: l.size,
            qty: l.qty,
          })),
          country: COUNTRY,
          countryGroups: COUNTRY_GROUPS,
        }
      : {
          cart: selected
            .map((line) => {
              const ids = parseIdsFromUid(line._uid);
              if (!ids.productId || typeof ids.style !== "number" || !line.size) return undefined;
              return {
                productId: ids.productId,
                style: ids.style,
                size: String(line.size),
                qty: Number(line.qty || 1),
              };
            })
            .filter(Boolean) as CartPayload["cart"],
          country: COUNTRY,
          countryGroups: COUNTRY_GROUPS,
        };

    try {
      await saveCart(payload);
      router.push("/checkout");
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  };

  const hasItems = Boolean(cart?.cartItems?.length);

  return (
    <div className={styles.cart}>
      {hasItems ? (
        <div className={styles.cart__container}>
          <CartHeader cartItems={cart.cartItems} selected={selected} setSelected={setSelected} />

          {synced?.anyChanged && (
            <div className={styles.notice}>
              We updated your cart to reflect current stock or pricing.
            </div>
          )}

          <div className={styles.cart__products}>
            {cart.cartItems.map((product) => (
              <Product
                key={product._uid}
                product={product}
                selected={selected}
                setSelected={setSelected}
              />
            ))}
          </div>

          <Checkout
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
            selected={selected}
            saveCartToDbHandler={saveCartToDbHandler}
          />

          <PaymentMethods />
        </div>
      ) : (
        <Empty />
      )}
      <ProductsSwiper products={women_swiper} />
    </div>
  );
}
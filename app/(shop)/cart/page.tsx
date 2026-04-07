// app/(shop)/cart/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { COUNTRIES } from "@/lib/countries";
import CartHeader from "@/components/cart/cartHeader";
import Product from "@/components/cart/product";
import { women_swiper } from "@/data/home";

import {
  saveCart,
  type CartPayloadItem,
  type SaveCartBody,
} from "@/requests/user";
import {
  syncCart,
  type CartSyncResponse,
  type ClientCartLine,
  type CartSyncBody,
} from "@/requests/cart";
import type { CartProduct } from "@/types/cart";

import styles from "@/app/styles/cart.module.scss";

interface CartState {
  cartItems: CartProduct[];
}
interface RootState {
  cart: CartState;
}

/** Parse productId & style index from legacy _uid = `${productId}_${styleIndex}_${sizeIndex}` */
function parseIdsFromUid(uid: string): { productId?: string; style?: number } {
  const [productId, styleStr] = String(uid || "").split("_");
  const style = Number(styleStr);
  return {
    productId: productId && productId.length >= 12 ? productId : undefined,
    style: Number.isFinite(style) ? style : undefined,
  };
}

// precise type guard for syncCart payload items
function isClientCartLine(
  v: ClientCartLine | undefined
): v is ClientCartLine {
  return (
    !!v &&
    typeof v.productId === "string" &&
    typeof v.style === "number" &&
    typeof v.size === "string" &&
    typeof v.qty === "number"
  );
}

// 👉 put your real mapping here:
const COUNTRY_GROUPS: Record<string, string[]> = {
  LOW_ECONOMY: ["EG", "PK", "BD", "IN", "MA", "TN"],
  // MENA: ["EG","SA","AE","..."], etc
};
type SyncedCartLine = CartSyncResponse["lines"][number] & { _uid: string };
const Checkout = dynamic(() => import("@/components/cart/checkout"));
const PaymentMethods = dynamic(() => import("@/components/cart/paymentMethods"));
const ProductsSwiper = dynamic(() => import("@/components/productsSwiper"));
const Empty = dynamic(() => import("@/components/cart/empty"));
export default function CartPage(): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();

  const { cart } = useSelector((state: RootState) => state);
  const [selected, setSelected] = useState<CartProduct[]>([]);
  const [countryCode, setCountryCode] = useState("US");

  // server-synced snapshot (prices/qty/shipping)
  const [synced, setSynced] = useState<CartSyncResponse | null>(null);
  // inside the component, after `const [synced, setSynced] = useState...`
 const syncedByUid = useMemo(() => {
  const map = new Map<string, SyncedCartLine>();
  if (!synced?.lines?.length) return map;

  for (const l of synced.lines) {
    // allow for servers that may echo back _uid
    const lWithOptionalUid = l as CartSyncResponse["lines"][number] & { _uid?: string };
    const echoUid: string | undefined = lWithOptionalUid._uid;

    let uid = echoUid;

    // otherwise, reconstruct by matching against the client's selected lines
    if (!uid) {
      const match = selected.find((s) => {
        const ids = parseIdsFromUid(s._uid);
        return (
          ids.productId === l.productId &&
          ids.style === l.style &&
          String(s.size) === String(l.size)
        );
      });
      uid = match?._uid;
    }

    if (uid) {
      const enriched: SyncedCartLine = { ...(l as CartSyncResponse["lines"][number]), _uid: uid };
      map.set(uid, enriched);
    }
  }

  return map;
}, [synced, selected]);  // ← depends on both

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectCountry = (): string => {
      try {
        const htmlLang = document.documentElement.lang || "";
        const langs = [
          htmlLang,
          ...(Array.isArray(navigator.languages) ? navigator.languages : []),
          navigator.language || "",
        ].filter(Boolean);

        for (const lang of langs) {
          const match = String(lang).match(/[-_](\w{2})$/);
          if (match?.[1]) return match[1].toUpperCase();
        }
      } catch {
        // ignore client locale parsing failures and keep fallback
      }
      return "US";
    };

    setCountryCode(detectCountry());
  }, []);

  // CALL /api/cart/sync whenever selection changes (and on mount)
  useEffect(() => {
    if (!selected.length) {
      setSynced(null);
      return;
    }
    (async () => {
      try {
        const payload: CartSyncBody = {
          cart: selected
            .map<ClientCartLine | undefined>((line) => {
              const ids = parseIdsFromUid(line._uid);
              if (!ids.productId || typeof ids.style !== "number" || !line.size) {
                return undefined;
              }
              return {
                productId: ids.productId,
                style: ids.style,
                size: String(line.size),
                qty: Number(line.qty || 1),
                _uid: line._uid,
              };
            })
            .filter(isClientCartLine),
          country: countryCode,
          countryGroups: COUNTRY_GROUPS,
        };

        const res = await syncCart(payload);
        setSynced(res);
      } catch (e) {
        console.error("cart sync failed:", e);
        setSynced(null);
      }
    })();
  }, [selected, countryCode]);

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
    const shipping = selected.reduce(
      (a, c) => a + Number(c.shipping ?? 0),
      0
    );
    const sub = selected.reduce(
      (a, c) => a + Number(c.price) * Number(c.qty),
      0
    );
    return {
      shippingFee: Number(shipping.toFixed(2)),
      subtotal: Number(sub.toFixed(2)),
      total: Number((sub + shipping).toFixed(2)),
    };
  }, [synced, selected]);

  // Save to DB, then go to checkout
  const saveCartToDbHandler = async (): Promise<void> => {
    if (!selected.length) return;
    if (!session) return void signIn();

    // Prefer synced lines if available (they reflect server-validated state)
    const cartLinesFromSynced: CartPayloadItem[] | null = synced
      ? synced.lines.map((l) => ({
          productId: l.productId,
          style: l.style,
          size: String(l.size),
          qty: l.qty,
        }))
      : null;

    const cartLinesFromSelected: CartPayloadItem[] = selected
      .map<CartPayloadItem | undefined>((line) => {
        const ids = parseIdsFromUid(line._uid);
        if (!ids.productId || typeof ids.style !== "number" || !line.size) {
          return undefined;
        }
        return {
          productId: ids.productId,
          style: ids.style,
          size: String(line.size),
          qty: Number(line.qty || 1),
        };
      })
      .filter((v): v is CartPayloadItem => Boolean(v));

    const body: SaveCartBody = {
      cart: cartLinesFromSynced ?? cartLinesFromSelected,
      country: countryCode,
      countryGroups: COUNTRY_GROUPS,
    };

    try {
      const res = await saveCart(body);
      if (!res.ok) throw new Error(res.error);
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
          <CartHeader
            cartItems={cart.cartItems}
            selected={selected}
            setSelected={setSelected}
          />

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
  syncedLine={syncedByUid.get(product._uid)}
  countryCode={countryCode}
/>
      ))}
    </div>

          <Checkout
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
            selected={selected}
            saveCartToDbHandler={saveCartToDbHandler}
            countryCode={countryCode}
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
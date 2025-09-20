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
import type { CartProduct } from "@/types/cart";

import styles from "@/app/styles/cart.module.scss";

/* ---------- Redux state ---------- */
interface CartState { cartItems: CartProduct[] }
interface RootState { cart: CartState }

/* ---------- Helpers ---------- */
/** Parse productId & style index from our legacy _uid = `${productId}_${styleIndex}_${sizeIndex}` */
function parseIdsFromUid(uid: string): { productId?: string; style?: number } {
  const parts = String(uid || "").split("_");
  const productId = parts[0];
  const style = Number(parts[1]);
  return {
    productId: productId && productId.length >= 12 ? productId : undefined,
    style: Number.isFinite(style) ? style : undefined,
  };
}

/* ---------- Component ---------- */
export default function CartPage(): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();

  const { cart } = useSelector((state: RootState) => state);
  const [selected, setSelected] = useState<CartProduct[]>([]);

  // derived totals from the selected lines
  const { shippingFee, subtotal, total } = useMemo(() => {
    const shipping = selected.reduce((acc, cur) => acc + Number(cur.shipping ?? 0), 0);
    const sub = selected.reduce((acc, cur) => acc + Number(cur.price) * Number(cur.qty), 0);
    return {
      shippingFee: Number(shipping.toFixed(2)),
      subtotal: Number(sub.toFixed(2)),
      total: Number((sub + shipping).toFixed(2)),
    };
  }, [selected]);

  // keep selection in sync with cart contents
  useEffect(() => {
    const items = cart?.cartItems ?? [];
    if (!items.length) {
      setSelected([]);
      return;
    }

    setSelected((prev) => {
      if (!prev.length) return items; // first load: select all

      const prevIds = new Set(prev.map((p) => p._uid));
      const merged = [...prev];

      // add any new items
      for (const it of items) {
        if (!prevIds.has(it._uid)) merged.push(it);
      }
      // drop items that no longer exist
      return merged.filter((p) => items.some((c) => c._uid === p._uid));
    });
  }, [cart?.cartItems]);

  // save to DB then go to checkout
  const saveCartToDbHandler = async (): Promise<void> => {
    if (!selected.length) return;

    if (!session) {
      // prompt login, then the user can click again
      signIn();
      return;
    }

    // Map UI lines -> API payload lines
    const payload: CartPayload = {
      cart: selected
        .map((line) => {
          const { productId, style } = parseIdsFromUid(line._uid);
          if (!productId || typeof style !== "number") return undefined;

          return {
            productId,
            style,
            size: String(line.size ?? ""), // API expects a size label
            qty: Number(line.qty || 1),
            color: line.color?.image ? { image: line.color.image } : undefined,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
      // Optionally include the shopper country to drive pricing on the server:
      // country: "US",
    };

    try {
      await saveCart(payload);
      router.push("/checkout");
    } catch (err) {
      // keep it quiet in UI, but log for now
      // (you could show a dialog/toast here if you have one)
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